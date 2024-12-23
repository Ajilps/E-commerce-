console.log("validating register form");

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const nameInput = document.querySelector('input[name="username"]');
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');

    const validators = {
        username: (value) => {
            return value.length >= 3 ? '' : 'Username must be at least 3 characters';
        },
        email: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value) ? '' : 'Please enter a valid email';
        },
        password: (value) => {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
            return passwordRegex.test(value) ? '' : 'Password must be 8+ characters with letters and numbers';
        },
        confirmPassword: (value) => {
            return value === passwordInput.value ? '' : 'Passwords do not match';
        }
    };

    const showError = (element, message) => {
        const errorDiv = element.nextElementSibling || document.createElement('div');
        errorDiv.className = 'error-message text-danger mt-1';
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

    const validateField = (input) => {
        const value = input.value.trim();
        const validatorName = input.name;
        const errorMessage = validators[validatorName](value);
        
        if (errorMessage) {
            showError(input, errorMessage);
            return false;
        }
        removeError(input);
        return true;
    };

    // Add input event listeners
    [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
        input.addEventListener('input', () => validateField(input));
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        let isValid = true;

        [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        if (isValid) {
            e.preventDefault();
            const formData = {
                username: document.querySelector('input[name="username"]').value.trim(),
                email: document.querySelector('input[name="email"]').value.trim(),
                password: document.querySelector('input[name="password"]').value
            };
    
            try {
                const response = await fetch('/user/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
    
                const data = await response.json();
    
                if (data.success) {
                    window.location.href = '/user/login';
                } else {
                    alert(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Registration failed');
            }
        }
    });
});