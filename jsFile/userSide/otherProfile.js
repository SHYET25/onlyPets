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

                // --- FETCH AND DISPLAY OTHER USER'S POSTS ---
    function fetchOtherUserPosts() {
        if (!email) return;
        $.ajax({
            url: 'phpFile/globalSide/fetchOtherUserPosts.php',
            method: 'GET',
            data: { email },
            dataType: 'json',
            success: function(response) {
                const $container = $('#otherUserPostsContainer');
                $container.empty();
                if (response.status === 'success' && response.posts.length > 0) {
                    response.posts.forEach((post, postIdx) => {
                        const mediaFiles = post.post_images ? JSON.parse(post.post_images) : [];
                        let mediaHtml = '';
                        if (mediaFiles.length > 0) {
                            mediaHtml = '<div class="row g-2">';
                            mediaFiles.forEach((file, idx) => {
                                const fileExtension = file.split('.').pop().toLowerCase();
                                const fileUrl = `media/images/posts/${file.trim()}`;
                                if (["jpg","jpeg","png","gif","webp"].includes(fileExtension)) {
                                    mediaHtml += `<div class=\"col-4\"><img src=\"${fileUrl}\" alt=\"Post Image\" class=\"img-fluid rounded img-thumbnail post-media-thumb\" style=\"cursor:pointer;max-height:180px;object-fit:cover;\" data-post-idx=\"${postIdx}\" data-media-idx=\"${idx}\"></div>`;
                                } else if (["mp4","avi","mkv","webm"].includes(fileExtension)) {
                                    mediaHtml += `<div class=\"col-4\"><video class=\"img-fluid rounded img-thumbnail post-media-thumb\" style=\"cursor:pointer;max-height:180px;object-fit:cover;\" data-post-idx=\"${postIdx}\" data-media-idx=\"${idx}\" muted><source src=\"${fileUrl}\" type=\"video/${fileExtension}\"></video></div>`;
                                }
                            });
                            mediaHtml += '</div>';
                        }
                        const postScopeIcon = post.post_scope === "public"
                            ? `<span id="postScopeContainer" style="margin-left:10px;color:#888;font-size:0.95rem;"><i id="postScope" class="fa-solid fa-earth-americas"></i></span>`
                            : `<span id="postScopeContainer" style="margin-left:10px;color:#888;font-size:0.95rem;"><i id="postScope" class="fa-solid fa-user-group"></i></span>`;
                        const postCard = $(`
                            <div class="post-card card p-3 mb-4">
                                <div class="post-header d-flex align-items-center mb-3">
                                    <img src="media/images/profiles/${post.user_img || 'default-profile.png'}" alt="User Profile" class="profile-img me-3">
                                    <div>
                                        <div class="d-flex">
                                            <div class="fw-bold">${post.user_fname} ${post.user_lname}</div>
                                            ${postScopeIcon}
                                        </div>
                                    </div>
                                </div>
                                <div class="post-content mb-3">
                                    <p>${post.post_caption}</p>
                                    <div class="row g-2">${mediaHtml}</div>
                                </div>
                                <div class="post-footer d-flex justify-content-between align-items-center">
                                    <div class="tagged-users">
                                        <span class="text-muted">Tagged: </span>
                                        <span class="tagged-user">${post.post_tagged || "None"}</span>
                                    </div>
                                    <div class="post-time text-muted">
                                        <span>Posted on: ${post.date_posted}</span>
                                    </div>
                                </div>
                                <div class="post-actions d-flex justify-content-start mt-3">
                                    <button class="btn btn-light btn-sm me-2"><i class="fas postFas fa-thumbs-up"></i> Like</button>
                                    <button class="btn btn-light btn-sm me-2" data-bs-toggle="modal" data-bs-target="#commentModal"><i class="fas postFas fa-comment"></i> Comment</button>
                                    <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#shareModal"><i class="fas postFas fa-share"></i> Share</button>
                                </div>
                            </div>
                        `);
                        $container.append(postCard);
                    });
                    // Store posts and media for modal navigation
                    window._otherProfilePostsMedia = response.posts.map(p => p.post_images ? JSON.parse(p.post_images) : []);
                } else {
                    $container.html('<div class="text-danger text-center">No posts found for this user.</div>');
                }
            },
            error: function() {
                $('#otherUserPostsContainer').html('<div class="text-danger text-center">Failed to fetch posts.</div>');
            }
        });
    }
    // Call after profile loads
    fetchOtherUserPosts();
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

// Modal logic for viewing and sliding media
$(document).on('click', '.post-media-thumb', function() {
    const postIdx = parseInt($(this).data('post-idx'));
    let mediaIdx = parseInt($(this).data('media-idx'));
    const mediaArr = window._otherProfilePostsMedia[postIdx];
    function renderMedia(idx) {
        const file = mediaArr[idx];
        const ext = file.split('.').pop().toLowerCase();
        const src = `media/images/posts/${file.trim()}`;
        if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
            $('#mediaModalBody').html(`<img src="${src}" class="img-fluid w-100" style="max-height:70vh;object-fit:contain;">`);
        } else if (["mp4","avi","mkv","webm"].includes(ext)) {
            $('#mediaModalBody').html(`<video src="${src}" class="w-100" style="max-height:70vh;object-fit:contain;" controls autoplay></video>`);
        }
        $('#mediaModalNext').off('click').on('click', function() {
            if (mediaIdx < mediaArr.length - 1) {
                mediaIdx++;
                renderMedia(mediaIdx);
            }
        });
        $('#mediaModalPrev').off('click').on('click', function() {
            if (mediaIdx > 0) {
                mediaIdx--;
                renderMedia(mediaIdx);
            }
        });
    }
    renderMedia(mediaIdx);
    $('#mediaModal').modal('show');
});

// --- SEARCH MODAL LOGIC (matches ownerHome) ---
function renderRecentSearches(recent) {
    let html = '';
    if (!recent || recent.length === 0) {
        html = '<div class="text-muted text-center">No recent searches.</div>';
    } else {
        recent.forEach(s => {
            html += `<div class="col-md-6 col-lg-4 mb-3">
                <div class="d-flex align-items-center border rounded p-2 recent-search-item" style="cursor:pointer;" data-name="${encodeURIComponent(s.name)}" data-img="${encodeURIComponent(s.img)}" data-location="${encodeURIComponent(s.location)}" data-email="${encodeURIComponent(s.email || '')}">
                    <img src="media/images/profiles/${s.img}" alt="Profile" class="rounded-circle me-3" width="50" height="50">
                    <div>
                        <strong>${s.name}</strong><br>
                        <small class="text-muted">${s.location}</small>
                    </div>
                </div>
            </div>`;
        });
    }
    $('#recentSearches').html(html);
}
function fetchRecentSearches() {
    $.get('phpFile/globalSide/fetchRecentSearches.php', function(res) {
        if (res.status === 'success') {
            renderRecentSearches(res.recent);
        } else {
            $('#recentSearches').html('<div class="text-muted text-center">No recent searches.</div>');
        }
    }, 'json');
}

// Show modal and fetch recent searches
$(document).on('click', '#searchIcon', function() {
    const searchModal = new bootstrap.Modal(document.getElementById('searchModal'));
    searchModal.show();
    fetchRecentSearches();
    setTimeout(function() {
        $('#searchInput').val('').focus();
        $('#searchSuggestions').hide().empty();
    }, 350);
});

// Suggestions as user types
$(document).on('input', '#searchInput', function() {
    const query = $(this).val().trim();
    if (query.length === 0) {
        $('#searchSuggestions').hide().empty();
        return;
    }
    $.ajax({
        url: 'phpFile/globalSide/searchSuggestions.php',
        method: 'POST',
        data: { query },
        dataType: 'json',
        success: function(suggestions) {
            if (suggestions.length > 0) {
                let html = '';
                suggestions.forEach(function(s) {
                    html += `<a href="#" class="list-group-item list-group-item-action search-suggestion-item" data-email="${encodeURIComponent(s.email)}" data-name="${encodeURIComponent(s.name)}" data-img="${encodeURIComponent(s.img)}" data-location="${encodeURIComponent(s.location)}">
                        <div class="d-flex align-items-center">
                            <img src="media/images/profiles/${s.img}" alt="Profile" class="rounded-circle me-3" width="40" height="40">
                            <div>
                                <strong>${s.name}</strong><br>
                                <small class="text-muted">${s.location}</small>
                            </div>
                        </div>
                    </a>`;
                });
                $('#searchSuggestions').html(html).show();
            } else {
                $('#searchSuggestions').html('<div class="list-group-item">No results found.</div>').show();
            }
        },
        error: function() {
            $('#searchSuggestions').html('<div class="list-group-item text-danger">Error fetching suggestions.</div>').show();
        }
    });
});
// Handle click on suggestion
$(document).on('click', '.search-suggestion-item', function(e) {
    e.preventDefault();
    const name = $(this).data('name');
    const img = $(this).data('img');
    const location = $(this).data('location');
    const email = $(this).data('email');
    // Add to recent searches in DB
    $.post('phpFile/globalSide/updateRecentSearches.php', {
        searched_user: JSON.stringify({ name: decodeURIComponent(name), img: decodeURIComponent(img), location: decodeURIComponent(location), email: decodeURIComponent(email) })
    }, function(res) {
        if (res.status === 'success') {
            renderRecentSearches(res.recent);
        }
        window.location.href = `otherProfile.html?name=${name}&img=${img}&location=${location}&email=${email}`;
    }, 'json');
});
// Handle click on recent search
$(document).on('click', '.recent-search-item', function() {
    const name = $(this).data('name');
    const img = $(this).data('img');
    const location = $(this).data('location');
    const email = $(this).data('email');
    window.location.href = `otherProfile.html?name=${name}&img=${img}&location=${location}&email=${email}`;
});
// Hide suggestions when modal closes
$('#searchModal').on('hidden.bs.modal', function() {
    $('#searchSuggestions').hide().empty();
    $('#searchInput').val('');
});


