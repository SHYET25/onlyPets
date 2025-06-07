let selectedFiles = [];

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

$('#postButton').on('click', function () {
    const caption = $('#postText').val();
    selectedFiles = Array.from($('#postMedia')[0].files);

    $('#previewCaption').text(caption);
    $('#previewMedia').empty();

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const previewWrapper = $('<div>', { class: 'media-preview-wrapper', style: 'position: relative; display: inline-block; margin: 5px;' });

            let element;
            if (file.type.startsWith('image/')) {
                element = $('<img>', { src: e.target.result, class: 'img-thumbnail', width: 100 });
            } else if (file.type.startsWith('video/')) {
                element = $('<video>', { src: e.target.result, width: 120, controls: true });
            }

            const removeBtn = $('<button>', {
                text: '×',
                class: 'btn btn-danger btn-sm remove-media-btn',
                style: 'position: absolute; top: -5px; right: -5px; border-radius: 50%; padding: 0 6px;'
            });

            // Remove logic
            removeBtn.on('click', function () {
                selectedFiles.splice(index, 1); // Remove file from array
                previewWrapper.remove();        // Remove from DOM
            });

            previewWrapper.append(element, removeBtn);
            $('#previewMedia').append(previewWrapper);
        };
        reader.readAsDataURL(file);
    });

    const modal = new bootstrap.Modal(document.getElementById('postPreviewModal'));
    modal.show();
});

$('#submitPost').on('click', async function () {
    const caption = $('#postText').val();
    const scope = $('#postScopeMain').val();
    const tagged = $('#taggedUsers').val();
    const taggedPets = $('#taggedPets').val();

    const mediaBase64Array = [];

    for (let file of selectedFiles) {
        const base64 = await toBase64(file);
        mediaBase64Array.push(base64);
    }

    $.ajax({
        url: 'phpFile/globalSide/uploadPost.php',
        method: 'POST',
        dataType: 'json',
        data: {
            caption,
            scope,
            tagged,
            taggedPets,
            media: JSON.stringify(mediaBase64Array)
        },
        success: function (res) {
            alert(res.message);
            $('#postText').val('');
            $('#postMedia').val('');
            $('#mediaPreview').empty();
            bootstrap.Modal.getInstance(document.getElementById('postPreviewModal')).hide();
        },
        error: function () {
            alert('Upload failed.');
        }
    });
});

// --- MODAL LOGIC FOR VIEWING AND SLIDING MEDIA (from otherProfile.js) ---
$(document).on('click', '.post-media-thumb', function() {
    const postIdx = parseInt($(this).data('post-idx'));
    let mediaIdx = parseInt($(this).data('media-idx'));
    const mediaArr = window._ownerHomePostsMedia[postIdx];
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

function renderPostCard(post, user, postIdx) {
    // user: {user_fname, user_lname, user_img, user_email}
    const profileImg = user && user.user_img ? `media/images/profiles/${user.user_img}` : 'media/images/default-profile.png';
    const profileName = user && user.user_fname && user.user_lname ? `${user.user_fname} ${user.user_lname}` : (user && user.user_email ? user.user_email : 'Unknown');
    const mediaFiles = post.post_images ? JSON.parse(post.post_images) : [];
    const mediaHtml = mediaFiles.map((file, idx) => {
        const fileExtension = file.split('.').pop().toLowerCase();
        const fileUrl = `media/images/posts/${file.trim()}`;
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
            return `<div class="col-4"><img src="${fileUrl}" alt="Post Image" class="img-fluid rounded img-thumbnail post-media-thumb" data-post-idx="${postIdx}" data-media-idx="${idx}" style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#mediaModal"></div>`;
        }
        if (["mp4", "avi", "mkv", "webm"].includes(fileExtension)) {
            return `<div class="col-4"><video controls class="img-fluid rounded img-thumbnail post-media-thumb" data-post-idx="${postIdx}" data-media-idx="${idx}" style="cursor:pointer;"><source src="${fileUrl}" type="video/${fileExtension}">Your browser does not support the video tag.</video></div>`;
        }
        return '';
    }).join("");
    const postScopeIcon = post.post_scope === "public"
        ? `<span id="postScopeContainer"><i id="postScope" class="fa-solid fa-earth-americas"></i></span>`
        : `<span id="postScopeContainer"><i id="postScope" class="fa-solid fa-user-group"></i></span>`;
    return $(`
        <div class="post-card card p-3 mb-4">
            <div class="post-header d-flex align-items-center mb-3">
                <img src="${profileImg}" alt="User Profile" class="profile-img me-3">
                <div>
                    <div class="d-flex">
                        <div class="fw-bold">${profileName}</div>
                        ${postScopeIcon}
                    </div>
                    <div class="text-muted" style="font-size:0.9rem;">${user && user.user_email ? user.user_email : ''}</div>
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
}

function fetchAndRenderFriendsPosts() {
    $.ajax({
        url: 'phpFile/globalSide/fetchFriendList.php',
        method: 'GET',
        dataType: 'json',
        success: function(res) {
            if (res.status === 'success' && Array.isArray(res.friends) && res.friends.length > 0) {
                const friendEmails = res.friends.map(f => f.user_email);
                // Fetch friends' posts for personalized tab
                $.ajax({
                    url: 'phpFile/globalSide/fetchFriendsPosts.php',
                    method: 'POST',
                    data: { emails: JSON.stringify(friendEmails) },
                    dataType: 'json',
                    success: function(response) {
                        const $personalized = $("#personalizedContainer .post-list").empty();
                        let personalizedMediaArr = [];
                        if (response.status === 'success' && Array.isArray(response.posts) && response.posts.length > 0) {
                            const friendMap = {};
                            if (Array.isArray(response.friends)) {
                                response.friends.forEach(friend => {
                                    friendMap[friend.user_email] = friend;
                                });
                            }
                            response.posts.forEach((post, idx) => {
                                post._idx = idx;
                                const friend = friendMap[post.poster_email];
                                personalizedMediaArr.push(post.post_images ? JSON.parse(post.post_images) : []);
                                $personalized.append(renderPostCard(post, friend, idx));
                            });
                        } else {
                            $personalized.html('<div class="text-danger text-center">No posts found from your friends.</div>');
                        }
                        window._ownerHomePostsMedia = personalizedMediaArr;
                    },
                    error: function() {
                        $("#personalizedContainer .post-list").html('<div class="text-danger text-center">Failed to fetch friends\' posts.</div>');
                    }
                });
                // Fetch all public posts for public tab
                $.ajax({
                    url: 'phpFile/globalSide/fetchUserPosts.php',
                    method: 'POST',
                    dataType: 'json',
                    success: function(response) {
                        const $public = $("#publicContainer .post-list").empty();
                        let publicMediaArr = [];
                        if (response.status === 'success' && Array.isArray(response.posts) && response.posts.length > 0) {
                            response.posts.forEach((post, idx) => {
                                if (post.post_scope !== 'public') return;
                                post._idx = idx;
                                let user = null;
                                if (post.user_img || (post.user_fname && post.user_lname)) {
                                    user = {
                                        user_img: post.user_img,
                                        user_fname: post.user_fname,
                                        user_lname: post.user_lname,
                                        user_email: post.poster_email
                                    };
                                } else {
                                    user = { user_email: post.poster_email };
                                }
                                publicMediaArr.push(post.post_images ? JSON.parse(post.post_images) : []);
                                $public.append(renderPostCard(post, user, idx));
                            });
                        } else {
                            $public.html('<div class="text-danger text-center">No public posts found.</div>');
                        }
                        window._ownerHomePostsMedia = publicMediaArr;
                    },
                    error: function() {
                        $("#publicContainer .post-list").html('<div class="text-danger text-center">Failed to fetch public posts.</div>');
                    }
                });
            } else {
                $("#personalizedContainer .post-list").html('<div class="text-danger text-center">No friends found.</div>');
                $("#publicContainer .post-list").html('<div class="text-danger text-center">No friends found.</div>');
            }
        },
        error: function() {
            $("#personalizedContainer .post-list").html('<div class="text-danger text-center">Failed to fetch friends.</div>');
            $("#publicContainer .post-list").html('<div class="text-danger text-center">Failed to fetch friends.</div>');
        }
    });
}

// Call this on page load and when personalized tab is clicked
$(document).ready(function() {
    fetchAndRenderFriendsPosts();
    $('#personalizedButton').on('click', function() {
        fetchAndRenderFriendsPosts();
    });
});

$.ajax({
    url: "phpFile/globalSide/fetchUserPosts.php",
    type: "POST",
    dataType: "json",
    success: function (response) {
        if (response.status === "success") {
            // Clear both containers first
            $("#personalizedContainer .post-list").empty();
            $("#publicContainer .post-list").empty();

            response.posts.forEach(post => {
                // Check if post_images is a valid JSON string and parse it
                const mediaFiles = post.post_images ? JSON.parse(post.post_images) : [];

                const mediaHtml = mediaFiles.map(file => {
                    const fileExtension = file.split('.').pop().toLowerCase();
                    const fileUrl = `media/images/posts/${file.trim()}`;

                    // If it's an image (jpg, jpeg, png)
                    if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
                        return `
                            <div class="col-4">
                                <img src="${fileUrl}" alt="Post Image" class="img-fluid rounded img-thumbnail"
                                     data-bs-toggle="modal" data-bs-target="#imageModal" onclick="showImage(this)">
                            </div>
                        `;
                    }

                    // If it's a video (mp4, avi, mkv, etc.)
                    if (['mp4', 'avi', 'mkv'].includes(fileExtension)) {
                        return `
                            <div class="col-4">
                                <video controls class="img-fluid rounded img-thumbnail">
                                    <source src="${fileUrl}" type="video/${fileExtension}">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        `;
                    }

                    // Return nothing if not an image or video (optional, handle other file types)
                    return '';
                }).join("");

                const postScopeIcon = post.post_scope === "public"
                    ? `<span id="postScopeContainer"><i id="postScope" class="fa-solid fa-earth-americas"></i></span>`
                    : `<span id="postScopeContainer"><i id="postScope" class="fa-solid fa-user-group"></i></span>`;

                const postCard = $(`
                    <div class="post-card card p-3 mb-4">
                        <div class="post-header d-flex align-items-center mb-3">
                            <img src="media/images/profiles/123.jpg" alt="User Profile" class="profile-img me-3">
                            <div>
                                <div class="d-flex">
                                    <div class="fw-bold">${post.poster_email}</div>
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
                            <button class="btn btn-light btn-sm me-2">
                                <i class="fas postFas fa-thumbs-up"></i> Like
                            </button>
                            <button class="btn btn-light btn-sm me-2" data-bs-toggle="modal" data-bs-target="#commentModal">
                                <i class="fas postFas fa-comment"></i> Comment
                            </button>
                            <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#shareModal">
                                <i class="fas postFas fa-share"></i> Share
                            </button>
                        </div>
                    </div>
                `);

                // Check the scope and append the post to the appropriate container
                if (post.post_scope === "friends") {
                    $("#personalizedContainer .post-list").append(postCard);
                } else if (post.post_scope === "public") {
                    $("#publicContainer .post-list").append(postCard);
                }
            });
        } else {
            $("#personalizedContainer .post-list, #publicContainer .post-list").html(`<div class="text-danger text-center">${response.message}</div>`);
        }
    },
    error: function () {
        $("#personalizedContainer .post-list, #publicContainer .post-list").html(`<div class="text-danger text-center">Failed to fetch posts.</div>`);
    }
});

// --- FRIEND LIST SIDEBAR LOGIC ---
function renderFriendList(friends) {
    const $friendList = $('#friendList').empty();
    if (!friends || friends.length === 0) {
        $friendList.append('<li class="list-group-item text-center">No friends found.</li>');
    } else {
        friends.forEach(function(friend) {
            const img = friend.user_img ? 'media/images/profiles/' + friend.user_img : 'media/images/default-profile.png';
            const name = (friend.user_fname && friend.user_lname) ? friend.user_fname + ' ' + friend.user_lname : 'Unknown';
            const location = (friend.user_country || '') + (friend.user_province ? ', ' + friend.user_province : '');
            const contact = friend.user_contact ? `<div class=\"text-muted\" style=\"font-size: 0.85rem;\"><i class=\"fas fa-phone-alt me-1\"></i> ${friend.user_contact}</div>` : '';
            const $li = $(`
                <li class="list-group-item friend-item d-flex align-items-center" style="background: linear-gradient(135deg, #38b6ff 75%, #85d2ff 100%); border-radius: 18px; margin-bottom: 12px; padding: 14px 18px; border: 2px solid #1976d2; box-shadow: 0 2px 8px #38b6ff22; cursor:pointer; transition: box-shadow 0.2s;">
                    <img src="${img}" alt="${name}" class="friend-img me-3 shadow" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 3px solid #38b6ff; box-shadow: 0 2px 8px #38b6ff22;">
                    <div>
                        <div class="fw-bold" style="font-size: 1.08rem; color: #fff;">${name}</div>
                        <div class="text-muted" style="font-size: 0.92rem; color: #e0f7fa;"><i class="fas fa-map-marker-alt me-1"></i> ${location}</div>
                        ${contact}
                    </div>
                </li>
                <hr style="margin: 0 0 8px 0; border-color: #b2ebf2;">
            `);
            $li.on('click', function(e) {
                window.location.href = `otherProfile.html?email=${encodeURIComponent(friend.user_email)}`;
            });
            $friendList.append($li);
        });
    }
}
function fetchFriendList() {
    $.ajax({
        url: 'phpFile/globalSide/fetchFriendList.php',
        method: 'GET',
        dataType: 'json',
        success: function(res) {
            if (res.status === 'success') {
                renderFriendList(res.friends);
            } else {
                $('#friendList').html('<li class="list-group-item text-danger">Failed to fetch friends.</li>');
            }
        },
        error: function() {
            $('#friendList').html('<li class="list-group-item text-danger">Failed to fetch friends.</li>');
        }
    });
}
$(document).ready(function() {
    fetchFriendList();
    // --- RECENT SEARCHES (PHP) ---
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
    fetchRecentSearches();

    $('#searchInput').on('input', function() {
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
});

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

// --- AUTOCOMPLETE FOR TAGGING FRIENDS IN POST PREVIEW MODAL ---
let friendSuggestions = [];

function fetchFriendSuggestions() {
    return $.ajax({
        url: 'phpFile/globalSide/fetchFriendList.php',
        method: 'GET',
        dataType: 'json',
    });
}

function filterFriendSuggestions(query) {
    query = query.trim().toLowerCase();
    if (!query) return [];
    return friendSuggestions.filter(friend => {
        const name = (friend.user_fname + ' ' + friend.user_lname).toLowerCase();
        const email = (friend.user_email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
    });
}

function renderTaggedUsersSuggestions(matches) {
    const $suggestions = $('#taggedUsersSuggestions');
    $suggestions.empty();
    if (matches.length === 0) {
        $suggestions.hide();
        return;
    }
    matches.forEach(friend => {
        const name = friend.user_fname + ' ' + friend.user_lname;
        const email = friend.user_email;
        const img = friend.user_img ? `media/images/profiles/${friend.user_img}` : 'media/images/default-profile.png';
        $suggestions.append(`
            <div class="tag-suggestion-item d-flex align-items-center px-2 py-1" style="cursor:pointer;" data-email="${email}" data-name="${name}">
                <img src="${img}" alt="Profile" class="rounded-circle me-2" style="width:28px;height:28px;object-fit:cover;">
                <span>${name} <small class="text-muted">(${email})</small></span>
            </div>
        `);
    });
    $suggestions.show();
}

$(document).ready(function() {
    // Insert suggestions dropdown if not present
    if ($('#taggedUsersSuggestions').length === 0) {
        $('#taggedUsers').after('<div id="taggedUsersSuggestions" class="list-group position-absolute w-100" style="z-index:9999;display:none;"></div>');
    }
    // Fetch friend list once
    fetchFriendSuggestions().done(function(res) {
        if (res.status === 'success' && Array.isArray(res.friends)) {
            friendSuggestions = res.friends;
        }
    });
    // Autocomplete logic
    $('#taggedUsers').on('input focus', function() {
        const input = $(this).val();
        // Support comma-separated, suggest for last part
        const parts = input.split(',');
        const last = parts[parts.length - 1].trim();
        if (!last) {
            $('#taggedUsersSuggestions').hide();
            return;
        }
        const matches = filterFriendSuggestions(last);
        renderTaggedUsersSuggestions(matches);
    });
    // Handle suggestion click
    $(document).on('click', '.tag-suggestion-item', function() {
        const email = $(this).data('email');
        const name = $(this).data('name');
        let input = $('#taggedUsers').val();
        let parts = input.split(',');
        parts[parts.length - 1] = name;
        // Remove duplicates
        parts = parts.map(p => p.trim()).filter((v, i, arr) => v && arr.indexOf(v) === i);
        $('#taggedUsers').val(parts.join(', ') + ', ');
        $('#taggedUsersSuggestions').hide();
        $('#taggedUsers').focus();
    });
    // Hide suggestions on blur (with delay for click)
    $('#taggedUsers').on('blur', function() {
        setTimeout(() => $('#taggedUsersSuggestions').hide(), 200);
    });
});




