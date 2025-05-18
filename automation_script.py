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
            # More aggressive options for Arch Linux
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--remote-debugging-port=9222")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-software-rasterizer")
            options.add_argument("--disable-web-security")
            options.add_argument("--allow-running-insecure-content")
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
        
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.maximize_window()
        
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
        """Navigate to product management page"""
        print("Navigating to product management...")
        self.driver.get(f"{self.base_url}/manage-products/")
        
        # Wait for page to load
        self.wait.until(
            EC.presence_of_element_located((By.TAG_NAME, "form"))
        )
        
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
        
        # Fill product form
        name_field = self.driver.find_element(By.NAME, "name")
        name_field.clear()
        name_field.send_keys(product_data["name"])
        
        description_field = self.driver.find_element(By.NAME, "description")
        description_field.clear()
        description_field.send_keys(product_data["description"])
        
        price_field = self.driver.find_element(By.NAME, "price")
        price_field.clear()
        price_field.send_keys(str(product_data["price"]))
        
        # Handle automatic image fetching
        if product_data.get("auto_image"):
            print(f"Fetching image for: {product_data['name']}")
            image_url = self.dynapictures_api.search_image(product_data["name"])
            if image_url:
                image_path = self.download_image(
                    image_url, 
                    f"{product_data['name'].replace(' ', '_').lower()}.jpg"
                )
                if image_path:
                    image_field = self.driver.find_element(By.NAME, "image")
                    image_field.send_keys(image_path)
                    print("Image uploaded successfully!")
        elif product_data.get("image_path"):
            image_field = self.driver.find_element(By.NAME, "image")
            image_field.send_keys(os.path.abspath(product_data["image_path"]))
        
        # Handle category selection (adjust selector based on your form)
        if product_data.get("category"):
            try:
                # Try dropdown first
                category_select = self.driver.find_element(By.NAME, "category")
                category_select.send_keys(product_data["category"])
            except:
                # Try text input
                category_field = self.driver.find_element(By.NAME, "category")
                category_field.clear()
                category_field.send_keys(product_data["category"])
        
        # Handle stock quantity if available
        if product_data.get("stock"):
            try:
                stock_field = self.driver.find_element(By.NAME, "stock")
                stock_field.clear()
                stock_field.send_keys(str(product_data["stock"]))
            except:
                pass  # Field might not exist
        
        # Submit form
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']")
        submit_button.click()
        
        # Wait for form submission
        time.sleep(3)
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
            "category": "Bouquets",
            "stock": 10,
            "auto_image": True  # Will fetch image automatically
        },
        {
            "name": "White Lily Arrangement",
            "description": "Elegant white lilies in a ceramic vase",
            "price": 62.50,
            "category": "Arrangements",
            "stock": 5,
            "auto_image": True
        },
        {
            "name": "Sunflower Field Bundle",
            "description": "Bright sunflowers to brighten any day",
            "price": 38.75,
            "category": "Seasonal",
            "stock": 8,
            "auto_image": True
        }
    ]
    
    # Run automation
    automation = FloresDjangoAutomation()
    automation.run_automation(products_to_create)