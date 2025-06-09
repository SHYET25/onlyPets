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
    // Instead of just names, send pet IDs for taggedPets
    const taggedPetIds = taggedPetsArr.map(p => p.id).filter(Boolean); // Array of pet IDs

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
            taggedPets: JSON.stringify(taggedPetIds), // Send as JSON array of IDs
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

// --- FETCH PET DETAILS FOR TAGGED PETS ---
function fetchTaggedPetsDetailsForPosts(posts, callback) {
    // Collect all unique pet IDs from all posts
    let allPetIds = [];
    posts.forEach(post => {
        if (post.tagged_pets) {
            try {
                const ids = JSON.parse(post.tagged_pets);
                if (Array.isArray(ids)) {
                    allPetIds = allPetIds.concat(ids.map(id => parseInt(id)));
                }
            } catch (e) {}
        }
    });
    allPetIds = Array.from(new Set(allPetIds.filter(id => !!id)));
    if (allPetIds.length === 0) {
        callback({});
        return;
    }
    $.ajax({
        url: 'phpFile/globalSide/fetchPetsByIds.php',
        method: 'POST',
        data: { pet_ids: allPetIds },
        dataType: 'json',
        success: function(res) {
            if (res.status === 'success' && Array.isArray(res.pets)) {
                // Map pet_id to pet info
                const petMap = {};
                res.pets.forEach(pet => { petMap[pet.pet_id] = pet; });
                callback(petMap);
            } else {
                callback({});
            }
        },
        error: function() { callback({}); }
    });
}

// --- PET DETAILS MODAL ---
if ($('#petDetailsModal').length === 0) {
    $('body').append(`
        <div class="modal fade" id="petDetailsModal" tabindex="-1" aria-labelledby="petDetailsLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="petDetailsLabel">Pet Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="petDetailsBody"></div>
                </div>
            </div>
        </div>
    `);
}

// --- CLICK HANDLER FOR TAGGED PETS ---
$(document).on('click', '.tagged-pets span', function() {
    const petId = $(this).data('pet-id');
    if (!petId) return;
    // Find pet info from the last loaded petMap (store globally)
    const pet = window._lastTaggedPetMap && window._lastTaggedPetMap[petId];
    if (!pet) return;
    const img = pet.pet_img ? `media/images/petPics/${pet.pet_img}` : 'media/images/default-profile.png';
    const vacImg = pet.pet_vaccine_img ? `<img src="media/images/vacPics/${pet.pet_vaccine_img}" class="img-fluid rounded mb-2" alt="Vaccine" style="max-width:120px;max-height:120px;object-fit:cover;">` : '';
    const html = `
        <div class="row">
            <div class="col-md-4 text-center mb-3">
                <img src="${img}" class="img-fluid rounded mb-3" alt="${pet.pet_name}" style="max-width:160px;max-height:160px;object-fit:cover;">
                ${vacImg}
            </div>
            <div class="col-md-8">
                <h5 class="mb-2">${pet.pet_name}</h5>
                <p><strong>Custom ID:</strong> ${pet.pet_custom_id || ''}</p>
                <p><strong>Type:</strong> ${pet.pet_type || ''}</p>
                <p><strong>Breed:</strong> ${pet.pet_breed || ''}</p>
                <p><strong>Birthdate:</strong> ${pet.pet_birthdate || ''}</p>
                <p><strong>Gender:</strong> ${pet.pet_gender || ''}</p>
                <p><strong>Color:</strong> ${pet.pet_color || ''}</p>
                <p><strong>Eye Color:</strong> ${pet.pet_eye_color || ''}</p>
                <p><strong>Weight:</strong> ${pet.pet_weight || ''} kg</p>
                <p><strong>Size:</strong> ${pet.pet_size || ''}</p>
                <p><strong>Allergies:</strong> ${pet.pet_allergies || 'None'}</p>
                <p><strong>Medical Conditions:</strong> ${pet.pet_medical_conditions || 'None'}</p>
                <p><strong>Owner:</strong> ${pet.pet_owner_email || ''}</p>
                <p><strong>Created At:</strong> ${pet.pet_created_at || ''}</p>
            </div>
        </div>
    `;
    $('#petDetailsBody').html(html);
    const modal = new bootstrap.Modal(document.getElementById('petDetailsModal'));
    modal.show();
});

// --- ENHANCED renderPostCard TO SHOW TAGGED PETS (with clickable) ---
function renderPostCard(post, user, postIdx, petMap) {
    // user: {user_fname, user_lname, user_img, user_email}
    const profileImg = user && user.user_img ? `media/images/profiles/${user.user_img}` : 'media/images/default-profile.png';
    const profileName = user && user.user_fname && user.user_lname
        ? `<a href="#" class="profile-name-link text-decoration-none text-dark fw-bold" data-email="${encodeURIComponent(user.user_email)}" style="cursor:pointer;">${user.user_fname} ${user.user_lname}</a>`
        : (user && user.user_email ? `<a href="#" class="profile-name-link text-decoration-none text-dark fw-bold" data-email="${encodeURIComponent(user.user_email)}" style="cursor:pointer;">${user.user_email}</a>` : 'Unknown');
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

    // --- TAGGED PETS LOGIC ---
    let taggedPetsHtml = '';
    if (post.tagged_pets) {
        try {
            const petIds = JSON.parse(post.tagged_pets);
            if (Array.isArray(petIds) && petIds.length > 0 && petMap) {
                // Store globally for modal use
                window._lastTaggedPetMap = petMap;
                taggedPetsHtml = petIds.map(pid => {
                    const pet = petMap[pid];
                    if (!pet) return '';
                    const img = pet.pet_img ? `media/images/petPics/${pet.pet_img}` : 'media/images/default-profile.png';
                    return `<span class="d-inline-flex align-items-center me-2 mb-1 p-1 px-2 rounded bg-light border tagged-pet-badge" style="gap:6px;min-width:0;cursor:pointer;" data-pet-id="${pet.pet_id}">
                        <img src="${img}" alt="${pet.pet_name}" class="rounded-circle border" style="width:28px;height:28px;object-fit:cover;">
                        <span class="fw-semibold text-dark" style="font-size:1rem;">${pet.pet_name}</span>
                        <span class="text-muted" style="font-size:0.92rem;">${pet.pet_breed}</span>
                    </span>`;
                }).join(' ');
            }
        } catch (e) {}
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

    // --- COMMENT COUNT LOGIC ---
    let commentCount = 0;
    if (post.comment_count !== undefined) {
        commentCount = post.comment_count;
    } else if (Array.isArray(post.comments)) {
        commentCount = post.comments.length;
    }

    // --- REPORT BUTTON HTML ---
    const reportBtnHtml = `<button class="btn btn-light btn-sm me-2 report-btn" data-post-id="${post.post_id}" title="Report this post"><i class="fas fa-flag"></i> Report</button>`;

    return `
        <div class="post-card card p-3 mb-4">
            <div class="post-header d-flex align-items-center mb-3">
                <img src="${profileImg}" alt="User Profile" class="profile-img me-3" style="width:48px;height:48px;object-fit:cover;">
                <div>
                    <div class="fw-bold">${profileName}</div>
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
                    <div class="tagged-pets mt-1">${taggedPetsHtml}</div>
                </div>
                <div class="post-time text-muted">
                    <span>Posted on: ${post.date_posted}</span>
                </div>
            </div>
            <div class="post-actions d-flex justify-content-start align-items-center mt-3">
                <button class="btn btn-light btn-sm me-2 like-btn ${likeBtnClass}" data-post-id="${post.post_id}" data-liked="${likedBySession}" data-post-idx="${postIdx}">
                    <i class="fas postFas ${likeIconClass}"></i> <span class="like-btn-text">${likeBtnText}</span> <span class="like-count ms-1">${likeCount}</span>
                </button>
                <button class="btn btn-light btn-sm me-2" data-bs-toggle="modal" data-bs-target="#commentModal">
                    <i class="fas postFas fa-comment"></i> Comment <span class="comment-count ms-1">${commentCount}</span>
                </button>
                ${reportBtnHtml}
            </div>
        </div>
    `;
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
        $btn.find('.like-btn-text').text('Like');
        likeCount = Math.max(0, likeCount - 1);
    } else {
        $btn.data('liked', true);
        $btn.addClass('liked');
        $btn.find('i').removeClass('fa-regular fa-thumbs-up').addClass('fa-solid fa-thumbs-up text-primary');
        $btn.find('.like-btn-text').text('Liked');
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
            if (res && typeof res.like_count !== 'undefined') {
                $btn.find('.like-count').text(res.like_count);
            }
            if (res && typeof res.liked !== 'undefined') {
                if (res.liked) {
                    $btn.addClass('liked');
                    $btn.find('i').removeClass('fa-regular').addClass('fa-solid text-primary');
                    $btn.find('.like-btn-text').text('Liked');
                } else {
                    $btn.removeClass('liked');
                    $btn.find('i').removeClass('fa-solid text-primary').addClass('fa-regular');
                    $btn.find('.like-btn-text').text('Like');
                }
                $btn.data('liked', res.liked);
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
                            // Fetch pet details for all posts before rendering
                            fetchTaggedPetsDetailsForPosts(response.posts, function(petMap) {
                                response.posts.forEach((post, idx) => {
                                    post._idx = idx;
                                    const friend = friendMap[post.poster_email];
                                    personalizedMediaArr.push(post.post_images ? JSON.parse(post.post_images) : []);
                                    $personalized.append(renderPostCard(post, friend, idx, petMap));
                                });
                                window._ownerHomePostsMedia = personalizedMediaArr;
                            });
                        } else {
                            $personalized.html('<div class="text-danger text-center">No posts found from your friends.</div>');
                        }
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
                // Fetch pet details for all posts before rendering
                fetchTaggedPetsDetailsForPosts(response.posts, function(petMap) {
                    response.posts.forEach((post, idx) => {
                        post._idx = idx;
                        let user = userMap[post.poster_email] || { user_email: post.poster_email };
                        publicMediaArr.push(post.post_images ? JSON.parse(post.post_images) : []);
                        $public.append(renderPostCard(post, user, idx, petMap));
                    });
                    window._ownerHomePostsMedia = publicMediaArr;
                });
            } else {
                $public.html('<div class="text-danger text-center">No public posts found.</div>');
            }
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
            // Message icon button
            const messageBtn = `<button class="btn btn-outline-primary btn-sm ms-auto message-friend-btn" data-email="${encodeURIComponent(friend.user_email)}" title="Message" style="border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-envelope"></i></button>`;
            const $li = $(`
                <li class="list-group-item friend-item d-flex align-items-center justify-content-between" style="background: linear-gradient(135deg, #38b6ff 75%, #85d2ff 100%); border-radius: 18px; margin-bottom: 12px; padding: 14px 18px; border: 2px solid #1976d2; box-shadow: 0 2px 8px #38b6ff22; cursor:pointer; transition: box-shadow 0.2s;">
                    <div class="d-flex align-items-center">
                        <img src="${img}" alt="${name}" class="friend-img me-3 shadow" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 3px solid #38b6ff; box-shadow: 0 2px 8px #38b6ff22;">
                        <div>
                            <div class="fw-bold" style="font-size: 1.08rem; color: #fff;">${name}</div>
                            <div class="text-muted" style="font-size: 0.92rem; color: #e0f7fa;"><i class="fas fa-map-marker-alt me-1"></i> ${location}</div>
                            ${contact}
                        </div>
                    </div>
                    ${messageBtn}
                </li>
                <hr style="margin: 0 0 8px 0; border-color: #b2ebf2;">
            `);
            $li.on('click', function(e) {
                // Prevent click if message button is clicked
                if ($(e.target).closest('.message-friend-btn').length) return;
                window.location.href = `otherProfile.html?email=${encodeURIComponent(friend.user_email)}`;
            });
            $li.find('.message-friend-btn').on('click', function(e) {
                e.stopPropagation();
                const email = decodeURIComponent($(this).data('email'));
                if (!email) {
                    alert('User email not found.');
                    return;
                }
                // Get user ID by email
                $.get('phpFile/globalSide/getUserIdByEmail.php', { email: email }, function(response) {
                    if (typeof response === "string") response = JSON.parse(response);
                    if (response.status === "success" && response.user_id) {
                        const userId = response.user_id;
                        const userName = name; // 'name' is already defined above for this friend

                        window.currentChatUserId = userId;
                        $('#userName').text(userName);

                        // Show chat modal
                        const conversationModal = new bootstrap.Modal(document.getElementById('conversationModal'));
                        conversationModal.show();

                        // Load messages and scroll to bottom after loading
                        if (typeof loadMessages === 'function') {
                            loadMessages(userId, function() {
                                const $conversation = $('#conversationContent');
                                $conversation.scrollTop($conversation[0].scrollHeight);
                            });
                        }
                        // Mark messages as read
                        $.post('phpFile/globalSide/markMessageRead.php', { other_user_id: userId }, function() {
                            if (typeof loadChats === 'function') loadChats();
                        });
                    } else {
                        alert('User not found.');
                    }
                });
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
            const imgSrc = req.user_img ? `media/images/profiles/${req.user_img}` : 'media/images/profiles/default.png';
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

// --- NOTIFICATIONS LOGIC FOR BELL DROPDOWN ---
function renderNotifications(notifications) {
    let html = '';
    // Always show the Notifications header at the top
    html += '<h4>Notifications</h4><hr>';
    if (!notifications || notifications.length === 0) {
        html += '<div class="text-muted text-center">No notifications.</div>';
    } else {
        notifications.forEach(function(n) {
            let profileImg = 'media/images/profiles/default.png';
            let displayName = 'Someone';
            let commentIdAttr = '';
            if (n.type === 'comment') {
                if (n.commenter_img) {
                    profileImg = 'media/images/profiles/' + n.commenter_img;
                }
                displayName = n.commenter_name ? n.commenter_name : 'Someone';
                if (n.comment_id) {
                    commentIdAttr = ` data-comment-id="${n.comment_id}"`;
                }
            } else if (n.type === 'like') {
                if (n.liker_img) {
                    profileImg = 'media/images/profiles/' + n.liker_img;
                }
                displayName = n.liker_name ? n.liker_name : 'Someone';
            }
            html += `
            <div class="notification-message" data-notification-id="${n.id}" data-type="${n.type}" data-ref-id="${n.ref_id}"${commentIdAttr} style="cursor:pointer;">
                <img class="profile-img me-2" src="${profileImg}" alt="Profile Picture">
                <div class="notification-details">
                    <p class="name mb-1">${displayName}</p>
                    <p class="notification mb-1">${n.message}</p>
                    <span class="time">${formatNotificationTime(n.created_at)}</span>
                </div>
            </div>`;
        });
    }
    // Place notifications above friend requests
    if ($('#bellDropdown .notifications-list').length === 0) {
        $('#bellDropdown').prepend('<div class="notifications-list mb-2"></div>');
    }
    $('#bellDropdown').find('.notifications-list').html(html);
}

function fetchNotifications() {
    $.get('phpFile/globalSide/fetchNotifications.php', function(res) {
        if (res.status === 'success') {
            renderNotifications(res.notifications);
        } else {
            renderNotifications([]);
        }
    }, 'json');
}

function formatNotificationTime(dateString) {
    // Format as relative time (e.g., '2 hours ago') or fallback to date
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return Math.floor(diffSec / 60) + ' min ago';
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + ' hr ago';
    if (diffSec < 604800) return Math.floor(diffSec / 86400) + ' day ago';
    return date.toLocaleString();
}

// Fetch notifications and friend requests when bell icon is clicked
$('#bellIcon').on('click', function() {
    fetchNotifications();
    fetchFriendRequests();
});

// --- BADGE COUNT LOGIC FOR BELL ICON ---
function updateBellBadge(notificationCount, friendReqCount) {
    const total = notificationCount + friendReqCount;
    let $badge = $('#bellIcon .bell-badge');
    if (total > 0) {
        if ($badge.length === 0) {
            // Use right instead of left for more reliable positioning
            $('#bellIcon').css('position', 'relative').append(`
                <span class="bell-badge badge bg-danger position-absolute top-0 end-0" style="right: -8px; top: -8px; font-size: 0.8rem; min-width: 1.5em; z-index: 10;">${total}</span>
            `);
        } else {
            $badge.text(total);
        }
    } else {
        $badge.remove();
    }
}

// --- WRAPPED FETCHES TO UPDATE BADGE ---
let _lastNotificationCount = 0;
let _lastFriendReqCount = 0;

function fetchNotificationsWithBadge() {
    $.get('phpFile/globalSide/fetchNotifications.php', function(res) {
        if (res.status === 'success') {
            _lastNotificationCount = Array.isArray(res.notifications) ? res.notifications.length : 0;
            renderNotifications(res.notifications);
            updateBellBadge(_lastNotificationCount, _lastFriendReqCount);
        }
    }, 'json');
}

function fetchFriendRequestsWithBadge() {
    $.get('phpFile/globalSide/fetchPendingFriendRequests.php', function(res) {
        if (res.status === 'success' || res.status === 'none') {
            _lastFriendReqCount = Array.isArray(res.requests) ? res.requests.length : 0;
            renderFriendRequests(res.requests);
            updateBellBadge(_lastNotificationCount, _lastFriendReqCount);
        }
    }, 'json');
}

// Replace original fetches for bell icon
$('#bellIcon').off('click').on('click', function() {
    fetchNotificationsWithBadge();
    fetchFriendRequestsWithBadge();
});

// On page load, fetch badge count
$(document).ready(function() {
    fetchNotificationsWithBadge();
    fetchFriendRequestsWithBadge();
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

// --- AUTOCOMPLETE FOR TAGGING PETS IN POST PREVIEW MODAL ---
let petSuggestions = [];
let taggedPetsArr = [];

function fetchUserPets() {
    return $.ajax({
        url: 'phpFile/globalSide/fetchUserPets.php',
        method: 'GET',
        dataType: 'json',
    });
}

function filterPetSuggestions(query) {
    query = query.trim().toLowerCase();
    if (!query) return [];
    return petSuggestions.filter(pet => {
        const name = (pet.pet_name || '').toLowerCase();
        const breed = (pet.pet_breed || '').toLowerCase();
        return name.includes(query) || breed.includes(query);
    });
}

function renderTaggedPetsSuggestions(matches) {
    const $suggestions = $('#taggedPetsSuggestions');
    $suggestions.empty();
    if (matches.length === 0) {
        $suggestions.hide();
        return;
    }
    matches.forEach(pet => {
        const img = pet.pet_img ? `media/images/petPics/${pet.pet_img}` : 'media/images/default-profile.png';
        $suggestions.append(`
            <div class="pet-suggestion-item d-flex align-items-center gap-3 px-3 py-2 mb-2 shadow border-0 bg-white rounded-4 position-relative" style="cursor:pointer; transition:box-shadow 0.2s, background 0.2s; min-height:64px;">
                <img src="${img}" alt="Pet" class="rounded-circle border border-3 border-primary shadow-sm" style="width:54px;height:54px;object-fit:cover;box-shadow:0 2px 12px #90caf955;">
                <div class="flex-grow-1">
                    <div class="fw-bold text-dark" style="font-size:1.18rem; letter-spacing:0.5px;">${pet.pet_name}</div>
                    <div class="text-secondary" style="font-size:1.01rem;">${pet.pet_breed}</div>
                </div>
                <span class="badge bg-info text-dark position-absolute top-0 end-0 mt-2 me-3" style="font-size:0.92rem;">Tag</span>
            </div>
        `);
    });
    $suggestions.show();
    $suggestions.find('.pet-suggestion-item').hover(
        function() { $(this).css({'background':'#e3f2fd','box-shadow':'0 4px 16px #90caf955'}); },
        function() { $(this).css({'background':'#fff','box-shadow':'0 2px 12px #90caf955'}); }
    );
}

$(document).ready(function() {
    // Insert suggestions dropdown if not present
    if ($('#taggedPetsSuggestions').length === 0) {
        $('#taggedPets').after('<div id="taggedPetsSuggestions" class="list-group position-absolute w-100" style="z-index:9999;display:none;"></div>');
    }
    // Fetch pet list once
    fetchUserPets().done(function(res) {
        if (res.status === 'success' && Array.isArray(res.pets)) {
            petSuggestions = res.pets;
        }
    });
    // Autocomplete logic
    $('#taggedPets').on('input focus', function() {
        const input = $(this).val();
        // Support comma-separated, suggest for last part
        const parts = input.split(',');
        const last = parts[parts.length - 1].trim();
        if (!last) {
            $('#taggedPetsSuggestions').hide();
            return;
        }
        const matches = filterPetSuggestions(last);
        renderTaggedPetsSuggestions(matches);
    });
    // Handle suggestion click
    $(document).on('click', '.pet-suggestion-item', function() {
        const petName = $(this).find('.fw-bold').text().trim();
        const petImg = $(this).find('img').attr('src');
        const petBreed = $(this).find('.text-secondary').text().trim();
        // Find the pet object in petSuggestions to get the ID
        const petObj = petSuggestions.find(p => p.pet_name === petName && p.pet_breed === petBreed);
        const petId = petObj ? petObj.pet_id : null;
        // Add to taggedPetsArr if not already present
        if (petId && !taggedPetsArr.some(p => p.id === petId)) {
            taggedPetsArr.push({ id: petId, name: petName, img: petImg, breed: petBreed });
        }
        // Get the current input value and split by comma
        let inputVal = $('#taggedPets').val();
        let parts = inputVal.split(',');
        // Replace the last part with the selected pet name
        parts[parts.length - 1] = ' ' + petName;
        // Join and trim to keep the same number of commas (same length as input)
        let newVal = parts.join(',').replace(/^\s+|\s+$/g, '');
        $('#taggedPets').val(newVal);
        $('#taggedPetsSuggestions').hide();
        $('#taggedPets').focus();
    });
    // Remove pet from taggedPetsArr if user edits input
    $('#taggedPets').on('input', function() {
        const inputNames = $(this).val().split(',').map(s => s.trim()).filter(Boolean);
        taggedPetsArr = taggedPetsArr.filter(p => inputNames.includes(p.name));
    });
    // Hide suggestions on blur (with delay for click)
    $('#taggedPets').on('blur', function() {
        setTimeout(() => $('#taggedPetsSuggestions').hide(), 200);
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
    // --- Optimistically update comment count in UI ---
    // Find the post card for the current post and update its comment count
    const $postCard = $(`.post-card .like-btn[data-post-id='${currentCommentPostId}']`).closest('.post-card');
    if ($postCard.length) {
        const $commentBtn = $postCard.find('.post-actions .btn-light:has(.fa-comment)');
        if ($commentBtn.length) {
            const $countSpan = $commentBtn.find('.comment-count');
            let count = parseInt($countSpan.text()) || 0;
            $countSpan.text(count + 1);
            $commentBtn.addClass('optimistic-comment'); // mark for possible rollback
        }
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
            // --- Rollback optimistic update if AJAX fails ---
            if ($postCard.length) {
                const $commentBtn = $postCard.find('.post-actions .btn-light:has(.fa-comment)');
                if ($commentBtn.length && $commentBtn.hasClass('optimistic-comment')) {
                    const $countSpan = $commentBtn.find('.comment-count');
                    let count = parseInt($countSpan.text()) || 1;
                    $countSpan.text(Math.max(0, count - 1));
                    $commentBtn.removeClass('optimistic-comment');
                }
            }
        },
        complete: function() {
            // Remove optimistic marker if present
            if ($postCard.length) {
                const $commentBtn = $postCard.find('.post-actions .btn-light:has(.fa-comment)');
                $commentBtn.removeClass('optimistic-comment');
            }
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

// --- CLICK HANDLER FOR PROFILE NAME LINK ---
$(document).on('click', '.profile-name-link', function(e) {
    e.preventDefault();
    const email = $(this).data('email');
    if (email) {
        window.location.href = `otherProfile.html?email=${email}`;
    }
});

// Accept friend request from bell dropdown
$(document).on('click', '.accept-friend-btn', function() {
    const sender_email = $(this).data('email');
    const $btn = $(this);
    $btn.prop('disabled', true);
    $.post('phpFile/globalSide/handleFriendRequestAction.php', {
        sender_email: sender_email,
        action: 'accept'
    }, function(res) {
        fetchFriendRequests();
        // Optionally, show a toast or alert
        // alert(res.message);
    }, 'json').always(function() { $btn.prop('disabled', false); });
});

// Reject friend request from bell dropdown
$(document).on('click', '.reject-friend-btn', function() {
    const sender_email = $(this).data('email');
    const $btn = $(this);
    $btn.prop('disabled', true);
    $.post('phpFile/globalSide/handleFriendRequestAction.php', {
        sender_email: sender_email,
        action: 'reject'
    }, function(res) {
        fetchFriendRequests();
        // Optionally, show a toast or alert
        // alert(res.message);
    }, 'json').always(function() { $btn.prop('disabled', false); });
});

// --- NOTIFICATION MODAL LOGIC ---
if ($('#notificationPostModal').length === 0) {
    $('body').append(`
        <div class="modal fade" id="notificationPostModal" tabindex="-1" aria-labelledby="notificationPostModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="notificationPostModalLabel">Notification Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="notificationPostModalBody"></div>
                </div>
            </div>
        </div>
    `);
}

// Click handler for notification
$(document).on('click', '.notification-message', function() {
    const notificationId = $(this).data('notification-id');
    const type = $(this).data('type');
    const refId = $(this).data('ref-id');
    let commentId = null;
    if (type === 'comment') {
        // Try to get comment_id from the notification message (already parsed in fetchNotifications.php)
        commentId = $(this).data('comment-id');
        if (!commentId && this.comment_id) commentId = this.comment_id;
    }
    // Mark notification as read (is_read = 1)
    if (notificationId) {
        $.post('phpFile/globalSide/markNotificationRead.php', { notification_id: notificationId });
    }
    if (!refId) return;
    $('#notificationPostModalBody').html('<div class="text-center py-4"><div class="spinner-border"></div></div>');
    const showModal = () => {
        const modal = new bootstrap.Modal(document.getElementById('notificationPostModal'));
        modal.show();
    };
    // Fetch post details
    $.ajax({
        url: 'phpFile/globalSide/fetchPostById.php',
        method: 'POST',
        data: { post_id: refId },
        dataType: 'json',
        success: function(res) {
            if (res.status === 'success' && res.post) {
                let postHtml = renderPostCardForModal(res.post, res.user, res.petMap);
                if (type === 'comment' && commentId) {
                    // Fetch the specific comment by comment_id
                    $.ajax({
                        url: 'phpFile/globalSide/fetchCommentById.php',
                        method: 'POST',
                        data: { comment_id: commentId },
                        dataType: 'json',
                        success: function(cRes) {
                            postHtml += '<hr><h6>Comment</h6>';
                            if (cRes.status === 'success' && cRes.comment) {
                                postHtml += renderSingleCommentForModal(cRes.comment);
                            } else {
                                postHtml += '<div class="text-muted">Comment not found.</div>';
                            }
                            $('#notificationPostModalBody').html(postHtml);
                            showModal();
                        },
                        error: function() {
                            postHtml += '<hr><div class="text-danger">Failed to load comment.</div>';
                            $('#notificationPostModalBody').html(postHtml);
                            showModal();
                        }
                    });
                } else if (type === 'comment') {
                    // Do not fallback, show error if commentId is missing
                    postHtml += '<hr><div class="text-danger">No comment_id provided in notification.</div>';
                    $('#notificationPostModalBody').html(postHtml);
                    showModal();
                } else {
                    $('#notificationPostModalBody').html(postHtml);
                    showModal();
                }
            } else {
                $('#notificationPostModalBody').html('<div class="text-danger">Post not found.</div>');
                showModal();
            }
        },
        error: function() {
            $('#notificationPostModalBody').html('<div class="text-danger">Failed to load post details.</div>');
            showModal();
        }
    });
});

// Helper: Render post card for modal (minimal version)
function renderPostCardForModal(post, user, petMap) {
    let profileImg = user && user.user_img ? `media/images/profiles/${user.user_img}` : 'media/images/default-profile.png';
    let html = `<div class="d-flex align-items-center mb-2">
        <img src="${profileImg}" class="rounded-circle me-2" style="width:48px;height:48px;object-fit:cover;">
        <div><strong>${user ? user.user_fname + ' ' + user.user_lname : 'User'}</strong></div>
    </div>`;
    html += `<div class="mb-2">${post.post_caption || ''}</div>`;
    if (post.post_images) {
        try {
            const imgs = JSON.parse(post.post_images);
            if (imgs && imgs.length > 0) {
                html += '<div class="mb-2">';
                imgs.forEach(img => {
                    html += `<img src="media/images/posts/${img}" class="img-fluid rounded mb-1 me-1" style="max-width:120px;max-height:120px;object-fit:cover;">`;
                });
                html += '</div>';
            }
        } catch(e) {}
    }
    // Tagged pets (optional)
    if (post.tagged_pets && petMap) {
        try {
            const petIds = JSON.parse(post.tagged_pets);
            if (petIds && petIds.length > 0) {
                html += '<div class="mb-2"><strong>Tagged Pets:</strong> ';
                petIds.forEach(pid => {
                    const pet = petMap[pid];
                    if (pet) {
                        html += `<span class="badge bg-info text-dark me-1">${pet.pet_name}</span>`;
                    }
                });
                html += '</div>';
            }
        } catch(e) {}
    }
    // --- COMMENT COUNT (for modal, fallback to comments array if needed) ---
    let commentCount = 0;
    if (typeof post.comment_count !== 'undefined') {
        commentCount = post.comment_count;
    } else if (Array.isArray(post.comments)) {
        commentCount = post.comments.length;
    }
    html += `<div class=\"mb-2\"><i class='fas fa-comment'></i> <span class='comment-count'>${commentCount}</span> Comment${commentCount === 1 ? '' : 's'}</div>`;
    return html;
}

// Helper: Render a single comment for modal
function renderSingleCommentForModal(comment) {
    if (!comment) return '';
    let img = comment.user_img ? `media/images/profiles/${comment.user_img}` : 'media/images/profiles/default.png';
    let name = (comment.user_fname && comment.user_lname) ? `${comment.user_fname} ${comment.user_lname}` : comment.user_email;
    return `<div class="d-flex align-items-start gap-2 mb-2">
        <img src="${img}" alt="Profile" class="rounded-circle me-2" style="width:40px;height:40px;object-fit:cover;">
        <div>
            <div><strong>${name}</strong> <span class="text-muted small">${comment.created_at}</span></div>
            <div>${comment.comment}</div>
        </div>
    </div>`;
}

// --- SEARCH MODAL LOGIC ---
if ($('#searchModal').length === 0) {
    $('body').append(`
        <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="searchModalLabel">Search Results</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <input type="text" class="form-control" id="searchInputModal" placeholder="Search posts and users..." autofocus>
                        </div>
                        <div id="searchSuggestionsModal"></div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

// --- SEARCH RESULT MODAL LOGIC ---
if ($('#searchResultModal').length === 0) {
    $('body').append(`
        <div class="modal fade" id="searchResultModal" tabindex="-1" aria-labelledby="searchResultModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="searchResultModalLabel">Search Results</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="searchResultModalBody"></div>
                </div>
            </div>
        </div>
    `);
}

// --- SEARCH RESULT MODAL MEDIA VIEWER LOGIC ---
function initSearchResultMediaViewer() {
    // Remove any previous handlers to avoid duplicates
    $('#searchResultModalBody').off('click', '.search-media-thumb');
    // Attach click handler for images/videos in search results
    $('#searchResultModalBody').on('click', '.search-media-thumb', function() {
        const $thumb = $(this);
        const mediaSrc = $thumb.data('media-src');
        const mediaType = $thumb.data('media-type');
        // Build modal content
        let content = '';
        if (mediaType && mediaType.startsWith('video')) {
            content = `<video controls style="max-width:100%;max-height:70vh;"><source src="${mediaSrc}" type="${mediaType}"></video>`;
        } else {
            content = `<img src="${mediaSrc}" class="img-fluid" style="max-width:100%;max-height:70vh;">`;
        }
        $('#searchResultMediaModalBody').html(content);
        const modal = new bootstrap.Modal(document.getElementById('searchResultMediaModal'));
        modal.show();
    });
}
// Create the modal if it doesn't exist
if ($('#searchResultMediaModal').length === 0) {
    $('body').append(`
        <div class="modal fade" id="searchResultMediaModal" tabindex="-1" aria-labelledby="searchResultMediaModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="searchResultMediaModalLabel">Media Viewer</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="searchResultMediaModalBody" style="text-align:center;"></div>
                </div>
            </div>
        </div>
    `);
}

// --- SEARCH RESULT MODAL: INIT MEDIA VIEWER AFTER RENDERING ---
$(document).on('shown.bs.modal', '#searchResultModal', function() {
    // Init media viewer for the search result modal
    initSearchResultMediaViewer();
});

$('#searchInput').on('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = $(this).val().trim();
        if (!query) return;
        // Show the search result modal
        const resultModal = new bootstrap.Modal(document.getElementById('searchResultModal'));
        resultModal.show();
        // Fetch related posts and users
        $.ajax({
            url: 'phpFile/globalSide/searchPostsAndUsers.php',
            method: 'POST',
            data: { query },
            dataType: 'json',
            success: function(res) {
                let html = '';
                if (res.posts && res.posts.length > 0) {
                    html += '<h6>Related Posts</h6>';
                    res.posts.forEach((post, idx) => {
                        // User info
                        const userImg = post.user_img ? `media/images/profiles/${post.user_img}` : 'media/images/default-profile.png';
                        const userName = `${post.user_fname || ''} ${post.user_lname || ''}`.trim();
                        const userEmail = post.poster_email || '';
                        // Likes
                        let likesArr = [];
                        if (post.likes) {
                            try { likesArr = JSON.parse(post.likes); } catch(e) { likesArr = []; }
                        }
                        const likeCount = likesArr.length;
                        // Comments
                        let commentCount = 0;
                        if (typeof post.comment_count !== 'undefined') commentCount = post.comment_count;
                        // Media
                        let mediaHtml = '';
                        if (post.post_images) {
                            try {
                                const imgs = JSON.parse(post.post_images);
                                if (imgs && imgs.length > 0) {
                                    mediaHtml += '<div class="d-flex flex-wrap gap-2 mb-2">';
                                    imgs.forEach(img => {
                                        const ext = img.split('.').pop().toLowerCase();
                                        let type = 'image/jpeg';
                                        if (["mp4","webm","ogg"].includes(ext)) {
                                            type = 'video/' + ext;
                                            mediaHtml += `<video class='search-media-thumb' src='media/images/posts/${img}' data-media-src='media/images/posts/${img}' data-media-type='${type}' style='width:100px;max-height:100px;object-fit:cover;cursor:pointer;' muted></video>`;
                                        } else {
                                            mediaHtml += `<img class='search-media-thumb' src='media/images/posts/${img}' data-media-src='media/images/posts/${img}' data-media-type='image/jpeg' style='width:100px;max-height:100px;object-fit:cover;cursor:pointer;'>`;
                                        }
                                    });
                                    mediaHtml += '</div>';
                                }
                            } catch(e) {}
                        }
                        // Like button logic (session email)
                        let sessionEmail = window._sessionEmailFromInfo || '';
                        const likedBySession = likesArr.map(e => (e + '').trim().toLowerCase()).includes(sessionEmail.trim().toLowerCase());
                        const likeBtnClass = likedBySession ? 'liked' : '';
                        const likeIconClass = likedBySession ? 'fa-solid fa-thumbs-up text-primary' : 'fa-regular fa-thumbs-up';
                        const likeBtnText = likedBySession ? 'Liked' : 'Like';
                        // Report button
                        const reportBtnHtml = `<button class="btn btn-light btn-sm me-2 report-btn" data-post-id="${post.post_id}" title="Report this post"><i class="fas fa-flag"></i> Report</button>`;
                        // Render card
                        html += `

                        <div class="post-card card p-3 mb-4">
                            <div class="post-header d-flex align-items-center mb-3">
                                <img src="${userImg}" alt="User Profile" class="profile-img me-3" style="width:48px;height:48px;object-fit:cover;">
                                <div>
                                    <div class="fw-bold">${userName}</div>
                                    <div class="text-muted" style="font-size:0.9rem;">${userEmail}</div>
                                </div>
                            </div>
                            <div class="post-content mb-3">
                                <p>${post.post_caption}</p>
                                ${mediaHtml}
                            </div>
                            <div class="post-footer d-flex justify-content-between align-items-center">
                                <div class="post-time text-muted">
                                    <span>Posted on: ${post.date_posted}</span>
                                </div>
                            </div>
                            <div class="post-actions d-flex justify-content-start align-items-center mt-3">
                                <button class="btn btn-light btn-sm me-2 like-btn ${likeBtnClass}" data-post-id="${post.post_id}" data-liked="${likedBySession}" data-post-idx="${idx}">
                                    <i class="fas postFas ${likeIconClass}"></i> <span class="like-btn-text">${likeBtnText}</span> <span class="like-count ms-1">${likeCount}</span>
                                </button>
                                <button class="btn btn-light btn-sm me-2" data-bs-toggle="modal" data-bs-target="#commentModal">
                                    <i class="fas postFas fa-comment"></i> Comment <span class="comment-count ms-1">${commentCount}</span>
                                </button>
                                ${reportBtnHtml}
                            </div>
                        </div>
                        `;
                    });
                } else {
                    html += '<div class="text-muted">No related posts found.</div>';
                }
                if (res.users && res.users.length > 0) {
                    html += '<h6 class="mt-3">Related Users</h6>';
                    res.users.forEach(user => {
                        const img = user.user_img ? `media/images/profiles/${user.user_img}` : 'media/images/default-profile.png';
                        html += `<div class="d-flex align-items-center border rounded p-2 mb-2">`;
                        html += `<img src="${img}" alt="Profile" class="rounded-circle me-3" width="50" height="50">`;
                        html += `<div><strong>${user.user_fname} ${user.user_lname}</strong><br><small class="text-muted">${user.user_email}</small></div>`;
                        html += `</div>`;
                    });
                } else {
                    html += '<div class="text-muted">No related users found.</div>';
                }
                $('#searchResultModalBody').html(html);
                initSearchResultMediaViewer();
            },
            error: function() {
                $('#searchResultModalBody').html('<div class="text-danger">Error searching posts and users.</div>');
            }
        });
    }
});

// --- SEARCH RESULT MODAL: UPDATE COMMENT COUNTS ON OPEN ---
$('#searchResultModal').on('shown.bs.modal', function() {
    // For each post card in the modal, fetch and update comment and like count, and liked state
    $('#searchResultModalBody .post-card').each(function() {
        const $postCard = $(this);
        // Try to get post ID from like-btn
        const $likeBtn = $postCard.find('.like-btn');
        let postId = $likeBtn.data('post-id');
        if (!postId) return; // skip if not found
        // --- Fetch latest comments for this post ---
        const $commentBtn = $postCard.find('.post-actions .btn-light:has(.fa-comment)');
        const $countSpan = $commentBtn.find('.comment-count');
        $.get('phpFile/globalSide/fetchComments.php', { post_id: postId }, function(res) {
            if (res.status === 'success' && Array.isArray(res.comments)) {
                $countSpan.text(res.comments.length);
            }
        }, 'json');
        // --- Fetch like count and liked state for this post ---
        // Use a dedicated endpoint for like status/count, not togglePostLike.php
        $.ajax({
            url: 'phpFile/globalSide/getPostLikeStatus.php',
            method: 'POST',
            data: { post_id: postId },
            dataType: 'json',
            success: function(res) {
                if (res && typeof res.like_count !== 'undefined') {
                    $likeBtn.find('.like-count').text(res.like_count);
                }
                if (res && typeof res.liked !== 'undefined') {
                    // Update like button UI
                    if (res.liked) {
                        $likeBtn.addClass('liked');
                        $likeBtn.find('i').removeClass('fa-regular').addClass('fa-solid text-primary');
                        $likeBtn.find('.like-btn-text').text('Liked');
                    } else {
                        $likeBtn.removeClass('liked');
                        $likeBtn.find('i').removeClass('fa-solid text-primary').addClass('fa-regular');
                        $likeBtn.find('.like-btn-text').text('Like');
                    }
                    $likeBtn.data('liked', res.liked);
                }
            }
        });
    });
});

// --- ALLOW MULTIPLE MODALS TO STACK (Bootstrap 5 patch) ---
$(document).on('show.bs.modal', '.modal', function () {
    var zIndex = 1050 + (10 * $('.modal:visible').length);
    $(this).css('z-index', zIndex);
    setTimeout(function() {
        $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
    }, 0);
});
$(document).on('hidden.bs.modal', '.modal', function () {
    if ($('.modal:visible').length > 0) {
        setTimeout(function() {
            $(document.body).addClass('modal-open');
        }, 0);
    }
});

// --- GLOBAL AJAX SETUP ---
$.ajaxSetup({
    error: function(jqXHR, textStatus, errorThrown) {
        // Handle session timeout (PHP returns 403 Forbidden)
        if (jqXHR.status === 403) {
            alert('Session expired. Please log in again.');
            window.location.href = 'login.html';
        } else {
            console.error('AJAX Error:', textStatus, errorThrown);
        }
    }
});


