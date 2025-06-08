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
    const tagged = JSON.stringify(taggedUsersArr); // Send as JSON array
    const taggedPets = $('#taggedPets').val();

    // Validation: prevent submit if both caption and media are empty
    if (!caption.trim() && selectedFiles.length === 0) {
        alert('Please enter a caption or select at least one media file.');
        return;
    }

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

    // --- TAGGED USERS LOGIC ---
    let taggedHtml = 'None';
    if (post.post_tagged) {
        try {
            const taggedArr = JSON.parse(post.post_tagged);
            if (Array.isArray(taggedArr) && taggedArr.length > 0) {
                taggedHtml = taggedArr.map(u =>
                    `<a href="#" class="tagged-user-link" data-email="${encodeURIComponent(u.email)}">${u.name}</a>`
                ).join(', ');
            }
        } catch (e) {
            taggedHtml = post.post_tagged;
        }
    }

    // --- LIKES LOGIC ---
    let likesArr = [];
    try {
        if (post.post_likes) likesArr = JSON.parse(post.post_likes);
    } catch (e) {}
    if (!Array.isArray(likesArr)) likesArr = [];
    likesArr = likesArr.filter(email => typeof email === 'string' && email.trim() !== '');
    likesArr = Array.from(new Set(likesArr));
    // Normalize emails for comparison
    const normalizedLikesArr = likesArr.map(e => (e + '').trim().toLowerCase());
    // Get session email directly from getSessionInfo.php
    let sessionEmail = '';
    if (window._sessionEmailFromInfo) {
        sessionEmail = window._sessionEmailFromInfo;
    } else {
        // Synchronously fetch session email from getSessionInfo.php (first post render only)
        $.ajax({
            url: 'phpFile/globalSide/getSessionInfo.php',
            method: 'GET',
            dataType: 'json',
            async: false,
            success: function(response) {
                if (response.status === 'success' && response.data && response.data.user_email) {
                    sessionEmail = (response.data.user_email + '').trim().toLowerCase();
                    window._sessionEmailFromInfo = sessionEmail;
                } else if (response.status === 'success' && response.data && response.data.vet_email) {
                    sessionEmail = (response.data.vet_email + '').trim().toLowerCase();
                    window._sessionEmailFromInfo = sessionEmail;
                }
            }
        });
    }
    console.log('Session email:', sessionEmail);
    const likedBySession = normalizedLikesArr.includes(sessionEmail);
    // Debug: Show liked post IDs for the session
    if (!window._sessionLikedPosts) window._sessionLikedPosts = [];
    if (likedBySession) {
        window._sessionLikedPosts.push(post.post_id);
    }
    const likeBtnClass = likedBySession ? 'liked' : '';
    const likeIconClass = likedBySession ? 'fa-solid fa-thumbs-up text-primary' : 'fa-regular fa-thumbs-up';
    const likeBtnText = likedBySession ? 'Liked' : 'Like';
    const likeCount = likesArr.length;

    // --- REPORT BUTTON HTML ---
    const reportBtnHtml = `<button class="btn btn-light btn-sm me-2 report-btn" data-post-id="${post.post_id}" title="Report this post"><i class="fas fa-flag"></i> Report</button>`;

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
                    <span class="tagged-user">${taggedHtml}</span>
                </div>
                <div class="post-time text-muted">
                    <span>Posted on: ${post.date_posted}</span>
                </div>
            </div>
            <div class="post-actions d-flex justify-content-start align-items-center mt-3">
                <button class="btn btn-light btn-sm me-2 like-btn ${likeBtnClass}" data-post-id="${post.post_id}" data-liked="${likedBySession}" data-post-idx="${postIdx}">
                    <i class="fas postFas ${likeIconClass}"></i> ${likeBtnText} <span class="like-count ms-1">${likeCount}</span>
                </button>
                <button class="btn btn-light btn-sm me-2" data-bs-toggle="modal" data-bs-target="#commentModal"><i class="fas postFas fa-comment"></i> Comment</button>
                ${reportBtnHtml}
            </div>
        </div>
    `);
}

// --- LIKE BUTTON HANDLER ---
$(document).on('click', '.like-btn', function() {
    const $btn = $(this);
    const postId = $btn.data('post-id');
    const liked = $btn.data('liked');
    // Optimistically update UI
    let likeCount = parseInt($btn.find('.like-count').text()) || 0;
    if (liked) {
        $btn.data('liked', false);
        $btn.removeClass('liked');
        $btn.find('i').removeClass('fa-solid fa-thumbs-up text-primary').addClass('fa-regular fa-thumbs-up');
        $btn.contents().filter(function() { return this.nodeType === 3; }).remove(); // Remove text node
        $btn.append(' Like ');
        likeCount = Math.max(0, likeCount - 1);
    } else {
        $btn.data('liked', true);
        $btn.addClass('liked');
        $btn.find('i').removeClass('fa-regular fa-thumbs-up').addClass('fa-solid fa-thumbs-up text-primary');
        $btn.contents().filter(function() { return this.nodeType === 3; }).remove(); // Remove text node
        $btn.append(' Liked ');
        likeCount = likeCount + 1;
    }
    $btn.find('.like-count').text(likeCount);
    // Send AJAX to backend to update likes
    $.ajax({
        url: 'phpFile/globalSide/togglePostLike.php',
        method: 'POST',
        data: { post_id: postId },
        dataType: 'json',
        success: function(res) {
            // Optionally update UI with actual like count from server
            if (res.status === 'success' && typeof res.like_count === 'number') {
                $btn.find('.like-count').text(res.like_count);
            }
            // Log activity if liked
            if ($btn.data('liked')) {
                // Get session email from cache (set in renderPostCard)
                var sessionEmail = window._sessionEmailFromInfo || '';
                $.ajax({
                    url: 'phpFile/globalSide/logSessionActivity.php',
                    method: 'POST',
                    data: {
                        user_email: sessionEmail,
                        activity_type: 'like',
                        activity: 'post_like',
                        activity_description: 'Liked a post',
                        act_id: 0, // Always 0 for like
                        post_id: postId // Use the real post_id
                    }
                });
            }
        }
    });
});

// --- CLICK HANDLER FOR TAGGED USER LINKS ---
$(document).on('click', '.tagged-user-link', function(e) {
    e.preventDefault();
    const email = $(this).data('email');
    if (email) {
        window.location.href = `otherProfile.html?email=${email}`;
    }
});

// --- FRIENDS POSTS (PERSONALIZED TAB) ---
function loadPersonalizedPosts() {
    window._sessionLikedPosts = [];
    $.ajax({
        url: 'phpFile/globalSide/fetchFriendList.php',
        method: 'GET',
        dataType: 'json',
        success: function(res) {
            if (res.status === 'success' && Array.isArray(res.friends) && res.friends.length > 0) {
                const friendEmails = res.friends.map(f => f.user_email);
                $.ajax({
                    url: 'phpFile/globalSide/fetchFriendsPosts.php',
                    method: 'POST',
                    data: { emails: JSON.stringify(friendEmails) },
                    dataType: 'json',
                    success: function(response) {
                        console.log('fetchFriendsPosts response:', response);
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
                        // Show liked posts in console
                        if (window._sessionLikedPosts && window._sessionLikedPosts.length > 0) {
                            console.log('Session liked posts:', window._sessionLikedPosts);
                        } else {
                            console.log('No post liked by session');
                        }
                    },
                    error: function() {
                        $("#personalizedContainer .post-list").html('<div class="text-danger text-center">Failed to fetch friends\' posts.</div>');
                    }
                });
            } else {
                $("#personalizedContainer .post-list").html('<div class="text-danger text-center">No friends found.</div>');
            }
        },
        error: function() {
            $("#personalizedContainer .post-list").html('<div class="text-danger text-center">Failed to fetch friends.</div>');
        }
    });
}

// --- PUBLIC POSTS (PUBLIC TAB) ---
function loadPublicPosts() {
    window._sessionLikedPosts = [];
    $.ajax({
        url: 'phpFile/globalSide/fetchAllOtherNonFriendPublicPosts.php',
        method: 'POST',
        dataType: 'json',
        success: function(response) {
            console.log('fetchAllOtherNonFriendPublicPosts response:', response);
            const $public = $("#publicContainer .post-list").empty();
            let publicMediaArr = [];
            if (response.status === 'success' && Array.isArray(response.posts) && response.posts.length > 0) {
                const userMap = {};
                if (Array.isArray(response.friends)) {
                    response.friends.forEach(friend => {
                        userMap[friend.user_email] = friend;
                    });
                }
                response.posts.forEach((post, idx) => {
                    post._idx = idx;
                    let user = userMap[post.poster_email] || { user_email: post.poster_email };
                    publicMediaArr.push(post.post_images ? JSON.parse(post.post_images) : []);
                    $public.append(renderPostCard(post, user, idx));
                });
            } else {
                $public.html('<div class="text-danger text-center">No public posts found.</div>');
            }
            window._ownerHomePostsMedia = publicMediaArr;
            // Show liked posts in console
            if (window._sessionLikedPosts && window._sessionLikedPosts.length > 0) {
                console.log('Session liked posts:', window._sessionLikedPosts);
            } else {
                console.log('No post liked by session');
            }
        },
        error: function() {
            $("#publicContainer .post-list").html('<div class="text-danger text-center">Failed to fetch public posts.</div>');
        }
    });
}

// --- TAB BUTTON HANDLERS ---
$(document).ready(function() {
    // On page load, load personalized tab by default
    loadPersonalizedPosts();
    $('#personalizedButton').on('click', function() {
        loadPersonalizedPosts();
    });
    $('#publicButton').on('click', function() {
        loadPublicPosts();
    });
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
let taggedUsersArr = [];

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
        // Add to taggedUsersArr if not already present
        if (!taggedUsersArr.some(u => u.email === email)) {
            taggedUsersArr.push({ name, email });
        }
        // Update input field to show names only
        const names = taggedUsersArr.map(u => u.name);
        $('#taggedUsers').val(names.join(', ') + (names.length ? ', ' : ''));
        $('#taggedUsersSuggestions').hide();
        $('#taggedUsers').focus();
    });
    // Remove user from taggedUsersArr if user edits input
    $('#taggedUsers').on('input', function() {
        const inputNames = $(this).val().split(',').map(s => s.trim()).filter(Boolean);
        taggedUsersArr = taggedUsersArr.filter(u => inputNames.includes(u.name));
    });
    // Hide suggestions on blur (with delay for click)
    $('#taggedUsers').on('blur', function() {
        setTimeout(() => $('#taggedUsersSuggestions').hide(), 200);
    });
});

// --- COMMENT MODAL LOGIC ---
let currentCommentPostId = null;

function renderComments(comments) {
    if (!Array.isArray(comments) || comments.length === 0) {
        $('#commentModalBody').html('<div class="text-muted text-center">No comments yet.</div>');
        return;
    }
    let html = '<div class="list-group">';
    comments.forEach(c => {
        const name = (c.user_fname && c.user_lname) ? `${c.user_fname} ${c.user_lname}` : c.user_email;
        const img = c.user_img ? `media/images/profiles/${c.user_img}` : 'media/images/default-profile.png';
        html += `
            <div class="list-group-item d-flex align-items-start gap-2">
                <img src="${img}" alt="Profile" class="rounded-circle me-2" style="width:40px;height:40px;object-fit:cover;">
                <div>
                    <div><strong>${name}</strong> <span class="text-muted small">${c.created_at}</span></div>
                    <div>${c.comment}</div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    $('#commentModalBody').html(html);
}

function fetchAndRenderComments(postId) {
    $.get('phpFile/globalSide/fetchComments.php', { post_id: postId }, function(res) {
        if (res.status === 'success') {
            renderComments(res.comments);
        } else {
            $('#commentModalBody').html('<div class="text-danger text-center">Failed to load comments.</div>');
        }
    }, 'json');
}

// Open comment modal when Comment button is clicked
$(document).on('click', '.post-actions .btn-light:has(.fa-comment)', function() {
    // Find the post ID from the closest like-btn or data attribute
    const $postCard = $(this).closest('.post-card');
    let postId = null;
    // Try to get from like-btn
    const $likeBtn = $postCard.find('.like-btn');
    if ($likeBtn.length) {
        postId = $likeBtn.data('post-id');
    }
    if (!postId) {
        // fallback: try data-post-id on this button
        postId = $(this).data('post-id');
    }
    currentCommentPostId = postId;
    // Clear input
    $('#newCommentInput').val('');
    fetchAndRenderComments(postId);
    $('#commentModal').modal('show');
});

// Submit comment
$('#submitCommentBtn').on('click', function() {
    const comment = $('#newCommentInput').val().trim();
    if (!comment) {
        alert('Please enter a comment.');
        return;
    }
    if (!currentCommentPostId) {
        alert('No post selected.');
        return;
    }
    // Get session email from global (set by getSessionInfo.js)
    const userEmail = window._sessionEmailFromInfo || '';
    if (!userEmail) {
        alert('Session not found. Please log in again.');
        return;
    }
    $.ajax({
        url: 'phpFile/globalSide/insertComment.php',
        method: 'POST',
        data: {
            post_id: currentCommentPostId,
            user_email: userEmail,
            comment: comment
        },
        success: function(res) {
            $('#newCommentInput').val('');
            fetchAndRenderComments(currentCommentPostId);
            if (res.status === 'success' && res.comment_id) {
                // Log activity for comment with correct act_id and post_id
                $.ajax({
                    url: 'phpFile/globalSide/logSessionActivity.php',
                    method: 'POST',
                    data: {
                        user_email: userEmail,
                        activity_type: 'comment',
                        activity: 'post_comment',
                        activity_description: 'Commented on a post',
                        act_id: res.comment_id, // The new comment's ID
                        post_id: currentCommentPostId // The post's ID
                    }
                });
            }
        },
        error: function() {
            alert('Failed to post comment.');
        }
    });
});

// --- REPORT BUTTON HANDLER ---
$(document).on('click', '.report-btn', function() {
    const postId = $(this).data('post-id');
    // Ask for a reason
    const reason = prompt('Please provide a reason for reporting this post:', 'Inappropriate or offensive content');
    if (reason === null) return; // Cancelled
    if (!reason.trim()) {
        alert('Please provide a valid reason.');
        return;
    }
    // Send report to server
    $.ajax({
        url: 'phpFile/globalSide/reportPost.php',
        method: 'POST',
        data: { post_id: postId, reason: reason.trim() },
        dataType: 'json',
        success: function(res) {
            alert(res.message);
            // Optionally, you can hide the post or take other actions
        },
        error: function() {
            alert('Failed to report the post.');
        }
    });
});




