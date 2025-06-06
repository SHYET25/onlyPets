// JS for dynamic rendering of other user's profile and pets
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
                    

                    const profileImg = data.user_img ? `media/images/profiles/${data.user_img}` : 'media/images/default.jpg';
                    
                    $('#sideProfile').attr('src', profileImg);
                } else if (role === 'veterinarian') {

                    const profileImg = data.vet_img ? `media/images/profiles/${data.vet_img}` : 'media/images/default.jpg';
                    
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

$(document).ready(function() {
    // Helper to get query param
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const email = getQueryParam('email');

    // Only fetch profile and pets if email is present
    if (email) {
        $.ajax({
            url: 'phpFile/globalSide/fetchOtherProfile.php',
            method: 'GET',
            data: { email },
            dataType: 'json',
            success: function(res) {
                if (res.status !== 'success') {
                    $('#fullName').text('User not found');
                    $('#profile').attr('src', 'media/images/default-profile.png');
                    return;
                }
                const user = res.user;
                const pets = res.pets;
                let location = user.user_country + user.user_province  || 'No location provided';
                // Render user info
                $('#fullName').text(user.user_fname + ' ' + user.user_lname);
                $('#profile').attr('src', user.user_img ? 'media/images/profiles/' + user.user_img : 'media/images/default-profile.png');
                $('#email').text(user.user_email).parent().show();
                $('#contact').text(user.user_contact).parent().show();
                // Render pets
                const $petList = $('#petList').empty();
                if (pets.length === 0) {
                    $petList.append('<li class="list-group-item text-center">No pets found.</li>');
                } else {
                    pets.forEach(function(pet) {
                        const petImg = pet.pet_img ? 'media/images/petPics/' + pet.pet_img : 'media/images/default-profile.png';
                        const $li = $('<li class="list-group-item pet-item d-flex align-items-center" style="background-color: #85d2ff; border-radius: 15px; margin-bottom: 10px; padding: 10px; border:none"></li>');
                        $li.append('<img src="' + petImg + '" alt="' + pet.pet_name + '" class="pet-img me-3" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #007bff;">');
                        $li.append('<div><div class="pet-name fw-bold" style="font-size: 1rem; color: #333;">' + pet.pet_name + '</div><div class="pet-breed text-muted" style="font-size: 0.9rem; color: #555;">' + pet.pet_breed + '</div></div>');
                        $li.on('click', function() {
                            const detailsHtml = `<div class="row"><div class="col-md-4"><img src="${petImg}" class="img-fluid rounded mb-3" alt="${pet.pet_name}"></div><div class="col-md-8"><h5>${pet.pet_name}</h5><p><strong>Custom ID:</strong> ${pet.pet_custom_id}</p><p><strong>Type:</strong> ${pet.pet_type}</p><p><strong>Breed:</strong> ${pet.pet_breed}</p><p><strong>Birthdate:</strong> ${pet.pet_birthdate}</p><p><strong>Gender:</strong> ${pet.pet_gender}</p><p><strong>Color:</strong> ${pet.pet_color}</p><p><strong>Eye Color:</strong> ${pet.pet_eye_color}</p><p><strong>Weight:</strong> ${pet.pet_weight} kg</p><p><strong>Size:</strong> ${pet.pet_size}</p><p><strong>Allergies:</strong> ${pet.pet_allergies || 'None'}</p><p><strong>Medical Conditions:</strong> ${pet.pet_medical_conditions || 'None'}</p></div></div>`;
                            $('#petDetailsBody').html(detailsHtml);
                            $('#petDetailsModal').modal('show');
                        });
                        $petList.append($li).append('<hr>');
                    });
                }

                // --- FRIEND REQUEST BUTTON LOGIC ---
                function setFriendBtnState(status, isReceiverPending) {
                    const $btn = $('#addFriendBtn');
                    $btn.removeClass('btn-success btn-outline-danger btn-secondary btn-warning').prop('disabled', false);
                    if (isReceiverPending) {
                        // Session user is the receiver of a pending request
                        $btn.removeClass('btn-warning');
                        $btn.css({'background':'transparent','border':'none'});
                        $btn.html(`
        <div class="d-flex gap-2 justify-content-center w-100">
            <button class="btn btn-success accept-friend-btn d-flex align-items-center justify-content-center" style="border-radius: 20px; min-width: 90px; font-weight: 600; font-size: 1rem; box-shadow: 0 2px 8px #38b6ff33;">
                <i class="fas fa-check me-1"></i> Accept
            </button>
            <button class="btn btn-outline-danger reject-friend-btn d-flex align-items-center justify-content-center" style="border-radius: 20px; min-width: 90px; font-weight: 600; font-size: 1rem; border-width: 2px;">
                <i class="fas fa-times me-1"></i> Reject
            </button>
        </div>
    `);
                        $btn.find('.accept-friend-btn').off('click').on('click', function(e) {
                            e.stopPropagation();
                            $btn.prop('disabled', true);
                            $.post('phpFile/globalSide/handleFriendRequestAction.php', {
                                sender_email: email,
                                action: 'accept'
                            }, function(res) {
                                setFriendBtnState('accepted', false);
                            }, 'json').always(function() { $btn.prop('disabled', false); });
                        });
                        $btn.find('.reject-friend-btn').off('click').on('click', function(e) {
                            e.stopPropagation();
                            $btn.prop('disabled', true);
                            $.post('phpFile/globalSide/handleFriendRequestAction.php', {
                                sender_email: email,
                                action: 'reject'
                            }, function(res) {
                                setFriendBtnState('none', false);
                            }, 'json').always(function() { $btn.prop('disabled', false); });
                        });
                    } else if (status === 'pending') {
                        $btn.addClass('btn-outline-danger');
                        $btn.html('<i class="fas fa-user-clock me-2"></i>Cancel Request');
                    } else if (status === 'accepted') {
                        $btn.addClass('btn-secondary').prop('disabled', false);
                        $btn.html('<i class="fas fa-user-check me-2"></i>Friends');
                    } else {
                        $btn.addClass('btn-success');
                        $btn.html('<i class="fas fa-user-plus me-2"></i>Add Friend');
                    }
                }

                function fetchFriendRequestStatus() {
                    $.ajax({
                        url: 'phpFile/globalSide/sendFriendRequest.php',
                        method: 'POST',
                        data: { receiver_email: email, check_status: 1 },
                        dataType: 'json',
                        success: function(res) {
                            // Check if session user is the receiver of a pending request
                            $.ajax({
                                url: 'phpFile/globalSide/fetchPendingFriendRequests.php',
                                method: 'GET',
                                dataType: 'json',
                                success: function(pendingRes) {
                                    let isReceiverPending = false;
                                    if (pendingRes.status === 'success' && Array.isArray(pendingRes.requests)) {
                                        isReceiverPending = pendingRes.requests.some(function(r) { return r.sender_email === email; });
                                    }
                                    // --- FIX: If already friends, always show Friends ---
                                    if (res.status === 'accepted') {
                                        setFriendBtnState('accepted', false);
                                        return;
                                    }
                                    // ---
                                    setFriendBtnState(res.status, isReceiverPending);
                                },
                                error: function() {
                                    // If status is accepted, always show Friends for both sender and receiver
                                    if (res.status === 'accepted') {
                                        setFriendBtnState('accepted', false);
                                    } else {
                                        setFriendBtnState(res.status, false);
                                    }
                                }
                            });
                        },
                        error: function() {
                            setFriendBtnState('none', false);
                        }
                    });
                }

                fetchFriendRequestStatus();

                $('#addFriendBtn').off('click').on('click', function() {
                    const $btn = $(this);
                    if ($btn.hasClass('btn-success')) {
                        // Send friend request
                        $btn.prop('disabled', true);
                        $.ajax({
                            url: 'phpFile/globalSide/sendFriendRequest.php',
                            method: 'POST',
                            data: { receiver_email: email },
                            dataType: 'json',
                            success: function(res) {
                                if (res.status === 'success' || res.status === 'pending') {
                                    setFriendBtnState('pending');
                                } else {
                                    alert(res.message || 'Failed to send friend request.');
                                    setFriendBtnState('none');
                                }
                            },
                            error: function() {
                                alert('Failed to send friend request.');
                                setFriendBtnState('none');
                            },
                            complete: function() {
                                $btn.prop('disabled', false);
                            }
                        });
                    } else if ($btn.hasClass('btn-outline-danger')) {
                        // Cancel request
                        $btn.prop('disabled', true);
                        $.ajax({
                            url: 'phpFile/globalSide/sendFriendRequest.php',
                            method: 'POST',
                            data: { receiver_email: email, cancel: 1 },
                            dataType: 'json',
                            success: function(res) {
                                setFriendBtnState('none');
                            },
                            error: function() {
                                alert('Failed to cancel request.');
                            },
                            complete: function() {
                                $btn.prop('disabled', false);
                            }
                        });
                    } else if ($btn.hasClass('btn-secondary')) {
                        // Unfriend
                        const name = $('#fullName').text();
                        if (!confirm(`Do you really want to unfriend ${name}?`)) {
                            return;
                        }
                        $btn.prop('disabled', true);
                        $.ajax({
                            url: 'phpFile/globalSide/unfriendUser.php',
                            method: 'POST',
                            data: { other_email: email },
                            dataType: 'json',
                            success: function(res) {
                                if (res.status === 'success') {
                                    setFriendBtnState('none');
                                } else {
                                    alert(res.message || 'Failed to unfriend.');
                                }
                            },
                            error: function() {
                                alert('Failed to unfriend.');
                            },
                            complete: function() {
                                $btn.prop('disabled', false);
                            }
                        });
                    }
                });
                // --- END FRIEND REQUEST BUTTON LOGIC ---
            },
            error: function() {
                $('#fullName').text('User not found');
                $('#profile').attr('src', 'media/images/default-profile.png');
            }
        });
    }
    // Hide add-pet/settings/logout for other profile
    $('.add-pet-btn, .settings-link, .logout-link').hide();
});

// Fetch pending friend requests for the session user and display in bellDropdown
function renderFriendRequests(requests) {
    let html = '';
    if (!requests || requests.length === 0) {
        html = '<div class="text-muted text-center">No pending friend requests.</div>';
    } else {
        requests.forEach(function(req) {
            const imgSrc = req.user_img ? `media/images/profiles/${req.user_img}` : 'media/images/profiles/default.jpg';
            html += `
            <div class="notification-message friend-request-notif d-flex align-items-center justify-content-between mb-2 p-2 border rounded shadow-sm" style="background: #f8fbff;">
                <div class="d-flex align-items-center">
                    <img class="profile-img rounded-circle me-3 border" src="${imgSrc}" alt="Profile Picture" width="48" height="48" style="object-fit:cover;">
                    <div>
                        <div class="fw-bold" style="font-size:1.1rem; color:#1976d2;">${req.name}</div>
                   
                        <div class="text-muted" style="font-size:0.85rem;">Sent a friend request</div>
                        <div class="text-muted" style="font-size:0.8rem;">${req.created_at}</div>
                    </div>
                </div>
                <div class="ms-2 d-flex flex-column gap-1 align-items-center">
                    <button class="btn btn-success btn-sm accept-friend-btn d-flex align-items-center justify-content-center mb-1" data-email="${req.user_email}" title="Accept" style="width:32px; height:32px; border-radius:50%;"><i class="fas fa-check"></i></button>
                    <button class="btn btn-danger btn-sm reject-friend-btn d-flex align-items-center justify-content-center" data-email="${req.user_email}" title="Reject" style="width:32px; height:32px; border-radius:50%;"><i class="fas fa-times"></i></button>
                </div>
            </div>`;
        });
    }
    // Add or update the friend requests section in bellDropdown
    if ($('#bellDropdown .friend-requests-list').length === 0) {
        $('#bellDropdown').prepend('<div class="friend-requests-list mb-2"></div><hr>');
    }
    $('#bellDropdown').find('.friend-requests-list').html(html);
}

function fetchFriendRequests() {
    $.get('phpFile/globalSide/fetchPendingFriendRequests.php', function(res) {
        if (res.status === 'success') {
            renderFriendRequests(res.requests);
        } else {
            renderFriendRequests([]);
        }
    }, 'json');
}

// Fetch friend requests when bell icon is clicked
$('#bellIcon').on('click', function() {
    fetchFriendRequests();
});

// Accept friend request
$(document).on('click', '.accept-friend-btn', function() {
    const sender_email = $(this).data('email');
    $.post('phpFile/globalSide/handleFriendRequestAction.php', {
        sender_email: sender_email,
        action: 'accept'
    }, function(res) {
        fetchFriendRequests();
    }, 'json');
});

// Reject friend request
$(document).on('click', '.reject-friend-btn', function() {
    const sender_email = $(this).data('email');
    $.post('phpFile/globalSide/handleFriendRequestAction.php', {
        sender_email: sender_email,
        action: 'reject'
    }, function(res) {
        fetchFriendRequests();
    }, 'json');
});
