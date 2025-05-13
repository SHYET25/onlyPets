$(document).ready(function () {
    $('#userEmail').on('input', function () {
        const email = $(this).val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === '') {
            $(this).addClass('is-invalid');
            $('#emailError').text("Email is required.");
        } else if (!emailRegex.test(email)) {
            $(this).addClass('is-invalid');
            $('#emailError').text("Please enter a valid email.");
        } else {
            $(this).removeClass('is-invalid');
            $('#emailError').text("");
        }
    });

    $('#userPass').on('input', function () {
        const pass = $(this).val().trim();
        let passError = "";

        if (pass.length < 8) {
            passError = "Password must be at least 8 characters.";
        } else if (!/[A-Z]/.test(pass)) {
            passError = "Password must include an uppercase letter.";
        } else if (!/[a-z]/.test(pass)) {
            passError = "Password must include a lowercase letter.";
        } else if (!/[0-9]/.test(pass)) {
            passError = "Password must include a number.";
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
            passError = "Password must include a special character.";
        }

        $('#passError').text(passError);
    });

    $('#userConfirmPass').on('input', function () {
        const pass = $('#userPass').val().trim();
        const confirmPass = $(this).val().trim();

        if (confirmPass === '') {
            $('#confirmError').text("Please confirm your password.");
        } else if (confirmPass !== pass) {
            $('#confirmError').text("Passwords do not match.");
        } else {
            $('#confirmError').text(""); // Clear error if valid
        }
    });

    $("#btnSign").click(function (e) {
        e.preventDefault(); // Prevent default action

        let userFname = $("#userFname").val();
        let userLname = $("#userLname").val();
        let userEmail = $("#userEmail").val();
        let countryCode = $("#countryCode").val();
        let contNumber = $("#contNumber").val();
        let userPass = $("#userPass").val();
        let userConfirmPass = $("#userConfirmPass").val();

        let isValid = true;

        // Final validation for email

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (userEmail === '') {
            $('#emailError').text("Email is required.");
            isValid = false;
        } else if (!emailRegex.test(userEmail)) {
            $('#emailError').text("Please enter a valid email.");
            isValid = false;
        } 

        if (userPass.length < 8) {
            passError = "Password must be at least 8 characters.";
            isValid = false;
        } else if (!/[A-Z]/.test(userPass)) {
            passError = "Password must include an uppercase letter.";
            isValid = false;
        } else if (!/[a-z]/.test(userPass)) {
            passError = "Password must include a lowercase letter.";
            isValid = false;
        } else if (!/[0-9]/.test(userPass)) {
            passError = "Password must include a number.";
            isValid = false;
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(userPass)) {
            passError = "Password must include a special character.";
            isValid = false;
        }

        if (userConfirmPass !== userPass) {
            $('#confirmError').text("Passwords do not match.");
            isValid = false;
        }


        // Validate required fields
        if (!userFname || !userLname || !userEmail || !contNumber || !userPass || !userConfirmPass) {
            $("#responseMessage").html('<div class="alert alert-danger">All fields are required!</div>');
            return;
        }

        // Validate password match
        if (userPass !== userConfirmPass) {
            $("#responseMessage").html('<div class="alert alert-danger">Passwords do not match!</div>');
            return;
        }
        if (isValid) {
            $.ajax({
                url: "phpFile/userSide/userSignUp.php",
                type: "POST",
                dataType: "json", // Expecting JSON response
                data: {
                    userFname: userFname,
                    userLname: userLname,
                    userEmail: userEmail,
                    userContact: countryCode + contNumber,
                    userPass: userPass
                },
                success: function (response) {
                    if (response.status === "success") {
                        $("#responseMessage").html('<div class="alert alert-success">' + response.message + '</div>');
                        setTimeout(function() {
                            window.location.href = 'verifyEmail.html'; // Redirect after success
                        }, 1000);
                    } else {
                        $("#responseMessage").html('<div class="alert alert-danger">' + response.message + '</div>');
                    }
                },
                error: function () {
                    $("#responseMessage").html('<div class="alert alert-danger">Something went wrong. Try again!</div>');
                }
            });
        }
    });

    $("#verifyButton").click(function () {
        let otp = '';
        for (let i = 0; i < 6; i++) {
            let digit = $(`#otpCode${i === 0 ? '' : i}`).val().trim();
            if (!digit) {
                alert('Please complete all OTP fields.');
                return;
            }
            otp += digit;
        }
    
        $.ajax({
            url: 'phpFile/userSide/verifyUser.php',
            type: 'POST',
            data: { otp: otp },
            success: function (response) {
                if (response.status === "success") {
                    alert(response.message);
                    window.location.href = 'index.html';
                } else {
                    alert(response.message);
                }
            },
            error: function () {
                alert('Request failed. Try again.');
            }
        });
    });
    
    $("#resendOtpButton").click(function () {
        $.ajax({
            url: 'phpFile/userSide/resendOTP.php',
            type: 'POST',
            success: function (response) {
                if (response.status === "success") {
                    alert(response.message);
                } else {
                    alert("Resend failed: " + response.message);
                }
            },
            error: function () {
                alert("Resend request failed.");
            }
        });
    });

    
    
});
