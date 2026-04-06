document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeWelcomeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.close();
        });
    }
});