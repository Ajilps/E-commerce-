document.addEventListener('DOMContentLoaded', function() {
    // document.querySelector('.password-toggle').addEventListener('click', function() {
    //     const passwordInput = document.querySelector('#password');
    //     if (passwordInput.type === 'password') {
    //         passwordInput.type = 'text';
    //         this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
    //             <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z"/>
    //             <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
    //             <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708"/>
    //         </svg>`;
    //     } else {
    //         passwordInput.type = 'password';
    //         this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
    //             <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M8 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9"/>
    //         </svg>`;
    //     }
    // });



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
                        showError(passwordInput, 'This user is not admin ');
                    //     window.location.href = '/user/home';
                    }
                    console.log(`data from server ${data.user}`);// debug
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