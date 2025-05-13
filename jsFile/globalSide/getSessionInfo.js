$(document).ready(function() {
    $.ajax({
        url: 'phpFile/globalSide/getSessionEmail.php',
        method: 'GET',
        dataType: 'json',
        success: function(res) {
            if (res.email) {
                $('#userEmailDisplay').text(res.email);
                console.log(res.email);
                console.log(res.device);
            } else {
                $('#userEmailDisplay').text("Guest");
            }
        },
        error: function() {
            $('#userEmailDisplay').text("Error retrieving email");
        }
    });
    
    $.ajax({
        url: 'phpFile/globalSide/checkSessionsValidity.php',
        method: 'POST',
        dataType: 'json',
        success: function (response) {
            if (response.status === 'expired') {
                alert("Your login has expired. Please log in again.");
                window.location.href = 'index.html';
            }
            // Optional: handle other status messages
        },
        error: function () {
            alert("An error occurred while checking login status.");
        }
    });

    $.ajax({
        url: 'phpFile/globalSide/getSessionInfo.php',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                const data = response.data;
                const role = response.role;

                if (role === 'user') {
                    $('#fullName').text(`${data.user_fname} ${data.user_lname}`);
                    $('#email').text(data.user_email);
                    $('#contact').text(data.user_contact);

                    const profileImg = data.user_img ? `media/images/profiles/${data.user_img}` : 'media/images/default.jpg';
                    $('#profile').attr('src', profileImg);
                    $('#sideProfile').attr('src', profileImg);
                } else if (role === 'veterinarian') {
                    $('#fullName').text(`${data.vet_fname} ${data.vet_lname}`);
                    $('#email').text(data.vet_email);
                    $('#contact').text(data.vet_contact);

                    const profileImg = data.vet_img ? `media/images/profiles/${data.vet_img}` : 'media/images/default.jpg';
                    $('#profile').attr('src', profileImg);
                    $('#sideProfile').attr('src', profileImg);
                } else {
                    // Unexpected role
                    window.location.href = 'index.html';
                }
            } else {
                // Session error, redirect
                window.location.href = 'index.html';
            }
        },
        error: function() {
            // AJAX error, redirect
            window.location.href = 'index.html';
        }
    });


    $.ajax({
        url: 'phpFile/globalSide/getSessionInfo.php',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                const data = response.data;
                const role = response.role;
    
                if (role === 'user') {
                    $('#fullName').text(data.user_fname + " " + data.user_lname);
                    $('#email').text(data.user_email);
                    $('#contact').text(data.user_contact);
                    $('#profile').attr('src', 'media/images/profiles/' + data.user_img);
                    $('#sideProfile').attr('src', 'media/images/profiles/' + data.user_img);
                } else if (role === 'veterinarian') {
                    $('#fullName').text(data.vet_fname + " " + data.vet_lname);
                    $('#email').text(data.vet_email);
                    $('#contact').text(data.vet_contact);
                    $('#profile').attr('src', 'media/images/profiles/' + data.vet_img);
                    $('#sideProfile').attr('src', 'media/images/profiles/' + data.vet_img);
                }
            } else {
                $('#fullName').text('Unknown User');
                $('#email').text('No session');
                $('#contact').text('-');
                $('#profile').attr('src', 'media/images/default.jpg'); // fallback image
                $('#sideProfile').attr('src', 'media/images/default.jpg'); // fallback image
            }
        },
        error: function() {
            $('#fullName').text('Error');
            $('#email').text('Could not fetch data');
            $('#contact').text('Error');
            $('#profile').attr('src', 'media/images/default.jpg'); // fallback on error
            $('#sideProfile').attr('src', 'media/images/default.jpg'); // fallback on error
        }
    });
        
    
});