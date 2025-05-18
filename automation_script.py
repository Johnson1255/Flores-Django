from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from selenium.webdriver.firefox.service import Service as FirefoxService
import time
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DynaPicturesAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.dynapictures.com/v1"
    
    def search_image(self, query, category="flowers"):
        """Search for images using DynaPictures API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        params = {
            "q": f"{query} {category}",
            "per_page": 1,
            "category": "nature"
        }
        
        try:
            response = requests.get(
                f"{self.base_url}/photos/search",
                headers=headers,
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("photos"):
                    return data["photos"][0]["src"]["large"]
            return None
        except Exception as e:
            print(f"Error fetching image: {e}")
            return None

class FloresDjangoAutomation:
    def __init__(self):
        self.base_url = os.getenv('BASE_URL', 'http://127.0.0.1:8000')
        self.username = os.getenv('ADMIN_USERNAME')
        self.password = os.getenv('ADMIN_PASSWORD')
        self.dynapictures_api = DynaPicturesAPI(os.getenv('DYNAPICTURES_API_KEY'))
        self.driver = None
        self.wait = None
    
    def setup_driver(self, browser="firefox"):
        """Initialize browser driver with options (firefox or chrome)"""
        print(f"Setting up {browser} driver...")
        
        if browser.lower() == "firefox":
            options = webdriver.FirefoxOptions()
            # Firefox options for better compatibility
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            # Uncomment for headless mode
            # options.add_argument("--headless")
            
            service = FirefoxService(GeckoDriverManager().install())
            self.driver = webdriver.Firefox(service=service, options=options)
            
        else:  # Chrome/Chromium
            options = webdriver.ChromeOptions()
            # More aggressive options for Arch Linux + slower machines
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--remote-debugging-port=9222")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-software-rasterizer")
            options.add_argument("--disable-web-security")
            options.add_argument("--allow-running-insecure-content")
            options.add_argument("--disable-features=VizDisplayCompositor")
            options.add_argument("--memory-pressure-off")
            options.add_argument("--max_old_space_size=4096")
            # Uncomment for headless mode
            # options.add_argument("--headless")
            
            # Try both chromium and chrome paths
            try:
                # Check if google-chrome is available
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=options)
            except Exception as e:
                print(f"Chrome failed: {e}")
                print("Trying with chromium binary...")
                options.binary_location = "/usr/bin/chromium"
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=options)
        
        # Increased wait time for slower machines
        self.wait = WebDriverWait(self.driver, 20)
        # Don't maximize window on slower machines to save resources
        # self.driver.maximize_window()
        
    def login(self):
        """Login to the application"""
        print("Navigating to login page...")
        self.driver.get(f"{self.base_url}/login/")
        
        # Wait for login form to load
        username_field = self.wait.until(
            EC.presence_of_element_located((By.NAME, "username"))
        )
        
        # Fill login form
        username_field.send_keys(self.username)
        password_field = self.driver.find_element(By.NAME, "password")
        password_field.send_keys(self.password)
        
        # Submit form
        login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']")
        login_button.click()
        
        # Wait for successful login (redirect)
        self.wait.until(EC.url_changes(f"{self.base_url}/login/"))
        print("Login successful!")
        
    def navigate_to_product_management(self):
        """Navigate to product management page and wait for loading"""
        print("Navigating to product management...")
        self.driver.get(f"{self.base_url}/floresvalentin_app/manage-products/")
        
        # Wait for splash/loading to complete
        print("Waiting for page to load...")
        time.sleep(3)
        
        # Wait for the insert tab form to be present
        try:
            # Wait for tabs to load
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "tab"))
            )
            
            # Click on insert tab to make sure form is visible
            insert_tab = self.driver.find_element(By.CSS_SELECTOR, "[data-tab='insert']")
            insert_tab.click()
            time.sleep(1)
            
            # Wait for the form to be present
            self.wait.until(
                EC.presence_of_element_located((By.ID, "insertProductForm"))
            )
            print("Product management page loaded successfully!")
            
        except Exception as e:
            print(f"Error waiting for page: {e}")
            # Take screenshot for debugging
            self.driver.save_screenshot("page_load_error.png")
            raise
        
    def download_image(self, image_url, filename):
        """Download image from URL and save locally"""
        if not image_url:
            return None
            
        try:
            response = requests.get(image_url)
            if response.status_code == 200:
                # Create images directory if it doesn't exist
                os.makedirs("temp_images", exist_ok=True)
                filepath = f"temp_images/{filename}"
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                return os.path.abspath(filepath)
        except Exception as e:
            print(f"Error downloading image: {e}")
        return None
        
    def create_product(self, product_data):
        """Create a new product with given data"""
        print(f"Creating product: {product_data['name']}")
        
        # Make sure we're on the insert tab
        insert_tab = self.driver.find_element(By.CSS_SELECTOR, "[data-tab='insert']")
        insert_tab.click()
        time.sleep(1)
        
        # Fill product form using the actual field IDs from the template
        name_field = self.wait.until(EC.presence_of_element_located((By.ID, "productName")))
        name_field.clear()
        name_field.send_keys(product_data["name"])
        
        # Category dropdown
        category_select = self.driver.find_element(By.ID, "productCategory")
        category_select.send_keys(product_data.get("category", ""))
        
        # Description
        description_field = self.driver.find_element(By.ID, "productDescription")
        description_field.clear()
        description_field.send_keys(product_data["description"])
        
        # Price
        price_field = self.driver.find_element(By.ID, "productPrice")
        price_field.clear()
        price_field.send_keys(str(product_data["price"]))
        
        # Stock
        stock_field = self.driver.find_element(By.ID, "productStock")
        stock_field.clear()
        stock_field.send_keys(str(product_data.get("stock", 0)))
        
        # Available checkbox
        available_checkbox = self.driver.find_element(By.ID, "productAvailable")
        if product_data.get("available", True) != available_checkbox.is_selected():
            available_checkbox.click()
        
        # Handle automatic image fetching (this part might need adjustment based on your backend)
        if product_data.get("auto_image"):
            print(f"Note: Auto-image feature needs backend integration for: {product_data['name']}")
        
        # Wait for form validation to enable submit button
        submit_button = self.wait.until(
            EC.element_to_be_clickable((By.ID, "insertBtn"))
        )
        
        # Submit form
        submit_button.click()
        
        # Wait for response/result
        time.sleep(3)
        
        # Check for success/error messages
        result_div = self.driver.find_element(By.ID, "result")
        result_text = result_div.text
        print(f"Result: {result_text}")
        
        if "error" in result_text.lower() or "error" in result_div.get_attribute("class"):
            raise Exception(f"Failed to create product: {result_text}")
        
        print("Product created successfully!")
        
    def cleanup_temp_files(self):
        """Clean up temporary image files"""
        import shutil
        if os.path.exists("temp_images"):
            shutil.rmtree("temp_images")
            print("Temporary files cleaned up!")
        
    def run_automation(self, products_list):
        """Main automation flow"""
        try:
            # Validate environment variables
            if not self.username or not self.password:
                raise ValueError("Admin credentials not found in environment variables")
            
            # Setup driver (try Firefox first, then Chrome)
            try:
                self.setup_driver("firefox")
            except Exception as firefox_error:
                print(f"Firefox failed: {firefox_error}")
                print("Trying Chrome...")
                self.setup_driver("chrome")
            
            # Login
            self.login()
            
            # Navigate to product management
            self.navigate_to_product_management()
            
            # Create each product
            for i, product in enumerate(products_list, 1):
                print(f"\n--- Creating product {i}/{len(products_list)} ---")
                self.create_product(product)
                time.sleep(2)  # Brief pause between creations
                
        except Exception as e:
            print(f"Error during automation: {e}")
            if self.driver:
                self.driver.save_screenshot("error_screenshot.png")
        finally:
            if self.driver:
                self.driver.quit()
            self.cleanup_temp_files()

# Example usage
if __name__ == "__main__":
    # Sample product data
    products_to_create = [
        {
            "name": "Red Rose Bouquet",
            "description": "Beautiful red roses perfect for special occasions",
            "price": 45.99,
            "category": "1",  # Use category ID instead of name
            "stock": 10,
            "available": True
        },
        {
            "name": "White Lily Arrangement", 
            "description": "Elegant white lilies in a ceramic vase",
            "price": 62.50,
            "category": "2",  # Adjust based on your categories
            "stock": 5,
            "available": True
        }
    ]
    
    # Run automation
    automation = FloresDjangoAutomation()
    automation.run_automation(products_to_create)