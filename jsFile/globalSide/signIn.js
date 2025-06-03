function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = 'dev-' + Math.random().toString(36).substring(2) + Date.now();
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

$('#btnLog').click(function(e) {
    e.preventDefault();

    let email = $('#indexEmail').val();
    let password = $('#indexPass').val();
    let recaptchaResponse = grecaptcha.getResponse();
    let deviceId = getDeviceId();

    if (!recaptchaResponse) {
        alert("Please complete the reCAPTCHA.");
        return;
    }

    $.ajax({
        url: 'phpFile/globalSide/signIn.php',
        type: 'POST',
        data: {
            userEmail: email,
            userPass: password,
            recaptcha: recaptchaResponse,
            loginDevice: deviceId
        },
        dataType: 'json',
        success: function(res) {
            if (res.status === 'success') {
                if (res.role === 'user') {
                    window.location.href = 'ownerHome.html';
                } else if (res.role === 'veterinarian') {
                    window.location.href = 'ownerHome.html';
                } else {
                    alert('Unknown user role. Please contact support.');
                    location.reload();
                }
            } else if (res.status === 'unverified') {
                if (confirm(res.message + " Do you want to verify now?")) {
                    window.location.href = 'verifyEmail.html';
                }
            } else if (res.status === 'device_unverified') {
                if (confirm(res.message + " Do you want to verify this device?")) {
                    window.location.href = 'verifyDevice.html';
                }
            } else {
                alert(res.message);
                location.reload();
            }
        },
        error: function() {
            alert("Server error.");
        }
    });
});

$('#submitForgotPassword').click(function(e) {
    e.preventDefault();

    let email = $('#emailInput').val();

    if (!email) {
        alert("Please enter your email address.");
        return;
    }

    $.ajax({
        url: 'phpFile/globalSide/sendForgotPassword.php',
        type: 'POST',
        data: { userEmail: email },
        dataType: 'json',
        success: function(res) {
            if (res.status === 'success') {
                alert(res.message);
            } else {
                alert(res.message);
            }
        },
        error: function() {
            alert("Server error. Please try again later.");
        }
    });
});

