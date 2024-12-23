document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');

    const showError = (element, message) => {
        const errorDiv = element.nextElementSibling || document.createElement('div');
        errorDiv.className = 'error-message text-danger';
        errorDiv.textContent = message;
        if (!element.nextElementSibling) {
            element.parentElement.appendChild(errorDiv);
        }
        element.classList.add('is-invalid');
    };

    const removeError = (element) => {
        const errorDiv = element.nextElementSibling;
        if (errorDiv?.classList.contains('error-message')) {
            errorDiv.remove();
        }
        element.classList.remove('is-invalid');
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;

        // Validate email
        if (!validateEmail(emailInput.value.trim())) {
            showError(emailInput, 'Please enter a valid email');
            isValid = false;
        } else {
            removeError(emailInput);
        }

        // Validate password
        if (!validatePassword(passwordInput.value)) {
            showError(passwordInput, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            removeError(passwordInput);
        }

        if (isValid) {
            try {
                const response = await fetch('/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: emailInput.value.trim(),
                        password: passwordInput.value
                    })
                });

                const data = await response.json();
                
                console.log(`data from server${data}`);

                if (data.success) {
                    if(data.user === 'admin'){
                        window.location.href = '/admin/home';
                    }else{

                        window.location.href = '/user/home';
                    }
                    console.log(`data from server ${data.user}`);
                } else {
                    showError(emailInput, data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Error:', error);
                showError(emailInput, 'Login failed. Please try again.');
            }
        }
    });
});