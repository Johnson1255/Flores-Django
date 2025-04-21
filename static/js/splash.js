document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const splashShownKey = 'splashShown';
    const splashDuration = 2000; // Duration in milliseconds (e.g., 2000ms = 2 seconds)

    if (!splashScreen || !mainContent) {
        console.error('Splash screen or main content element not found.');
        if (mainContent) mainContent.classList.add('visible'); // Ensure content is visible if splash fails
        return;
    }

    // Check if splash has already been shown this session
    if (sessionStorage.getItem(splashShownKey)) {
        // Hide splash immediately, show content
        splashScreen.style.display = 'none'; // Use display:none to remove it completely
        mainContent.classList.add('visible');
    } else {
        // Show splash, then hide after duration
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            mainContent.classList.add('visible');

            // Set flag in sessionStorage
            sessionStorage.setItem(splashShownKey, 'true');

            // Optional: Remove splash screen from DOM after transition
            splashScreen.addEventListener('transitionend', () => {
                splashScreen.style.display = 'none';
            }, { once: true });

        }, splashDuration);
    }
});
