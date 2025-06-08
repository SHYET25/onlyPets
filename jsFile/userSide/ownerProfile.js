$.ajax({
    url: "phpFile/globalSide/fetchOwnedPets.php",
    type: "POST",
    dataType: "json",
    success: function (response) {
        if (response.status === "success") {
            const list = $("#petList").empty();

            let petsGrouped = {};

            response.pets.forEach(pet => {
                const id = pet.pet_id;

                if (!petsGrouped[id]) {
                    petsGrouped[id] = {
                        info: pet,
                        vaccinations: []
                    };
                }

                if (pet.vaccine_name && pet.vaccination_date) {
                    petsGrouped[id].vaccinations.push({
                        name: pet.vaccine_name,
                        date: pet.vaccination_date,
                        remarks: pet.remarks
                    });
                }
            });

            // Show name + breed in the list
            Object.entries(petsGrouped).forEach(([id, { info, vaccinations }]) => {
                const listItem = $(`
                <li class="list-group-item pet-item d-flex align-items-center" style=" background-color: #85d2ff; border-radius: 15px; margin-bottom: 10px; padding: 10px; border:none">
                    <img src="media/images/petPics/${info.pet_img}" alt="${info.pet_name}" class="pet-img me-3" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #007bff;">
                    <div>
                        <div class="pet-name fw-bold" style="font-size: 1rem; color: #333;">${info.pet_name}</div>
                        <div class="pet-breed text-muted" style="font-size: 0.9rem; color: #555;">${info.pet_breed}</div>
                    </div>
                </li>
                <hr>
            `);

                listItem.on("click", function () {
                    const detailsHtml = `
                        <div class="row">
                            <div class="col-md-4">
                                <img src="media/images/petPics/${info.pet_img}" class="img-fluid rounded mb-3" alt="${info.pet_name}">
                            </div>
                            <div class="col-md-8">
                                <h5>${info.pet_name}</h5>
                                <p><strong>Custom ID:</strong> ${info.pet_custom_id}</p>
                                <p><strong>Type:</strong> ${info.pet_type}</p>
                                <p><strong>Breed:</strong> ${info.pet_breed}</p>
                                <p><strong>Birthdate:</strong> ${info.pet_birthdate}</p>
                                <p><strong>Gender:</strong> ${info.pet_gender}</p>
                                <p><strong>Color:</strong> ${info.pet_color}</p>
                                <p><strong>Eye Color:</strong> ${info.pet_eye_color}</p>
                                <p><strong>Weight:</strong> ${info.pet_weight} kg</p>
                                <p><strong>Size:</strong> ${info.pet_size}</p>
                                <p><strong>Allergies:</strong> ${info.pet_allergies || 'None'}</p>
                                <p><strong>Medical Conditions:</strong> ${info.pet_medical_conditions || 'None'}</p>
                            </div>
                        </div>
                        <hr>
                        <h6>Vaccinations</h6>
                        <ul>
                            ${vaccinations.length ? vaccinations.map(v =>
                                `<li><strong>${v.name}</strong> (${v.date})<br>${v.remarks || ''}</li>`).join('')
                                : '<li>No vaccinations recorded</li>'}
                        </ul>
                    `;

                    $("#petDetailsBody").html(detailsHtml);
                    $("#petDetailsModal").modal("show");
                });

                list.append(listItem);
            });
        } else {
            $("#petList").html(`<li class="list-group-item text-danger">${response.message}</li>`);
        }
    },
    error: function () {
        $("#petList").html(`<li class="list-group-item text-danger">Failed to fetch pets.</li>`);
    }
});

// --- RENDER POST CARD FOR SESSION USER POSTS ---
function renderPostCard(post, user, postIdx, petInfoMap) {
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
        ? `<span id="postScopeContainer"><i id="postScope" class="fa-solid fa-earth-americas ms-2 text-primary"></i></span>`
        : `<span id="postScopeContainer"><i id="postScope" class="fa-solid fa-user-group ms-2 text-secondary"></i></span>`;
    // --- LIKES LOGIC ---
    let likesArr = [];
    let likedBySession = false;
    let likeCount = 0;
    // Use backend-provided like_count and liked if available, else fallback to post_likes array
    if (typeof post.liked !== 'undefined' && typeof post.like_count !== 'undefined') {
        likedBySession = !!post.liked;
        likeCount = parseInt(post.like_count) || 0;
    } else {
        try {
            if (post.post_likes) likesArr = JSON.parse(post.post_likes);
        } catch (e) {}
        if (!Array.isArray(likesArr)) likesArr = [];
        likesArr = likesArr.filter(email => typeof email === 'string' && email.trim() !== '');
        likesArr = Array.from(new Set(likesArr));
        // Normalize emails for comparison
        const normalizedLikesArr = likesArr.map(e => (e + '').trim().toLowerCase());
        // Get session email directly from getSessionInfo.js
        let sessionEmail = window._sessionEmailFromInfo || '';
        likedBySession = normalizedLikesArr.includes(sessionEmail.trim().toLowerCase());
        likeCount = likesArr.length;
    }
    const likeBtnClass = likedBySession ? 'liked' : '';
    const likeIconClass = likedBySession ? 'fa-solid fa-thumbs-up text-primary' : 'fa-regular fa-thumbs-up';
    const likeBtnText = likedBySession ? 'Liked' : 'Like';
    // --- COMMENT COUNT LOGIC ---
    let commentCount = 0;
    if (post.comment_count !== undefined) {
        commentCount = post.comment_count;
    } else if (Array.isArray(post.comments)) {
        commentCount = post.comments.length;
    }
    // --- REPORT BUTTON HTML ---
    const reportBtnHtml = `<button class="btn btn-light btn-sm me-2 report-btn" data-post-id="${post.post_id}" title="Report this post"><i class="fas fa-flag"></i> Report</button>`;

    // --- TAGGED USERS LOGIC (ownerHome style) ---
    let taggedHtml = '';
    if (Array.isArray(post.post_tagged) && post.post_tagged.length > 0) {
        taggedHtml = post.post_tagged.map(u =>
            u && u.name && u.email
                ? `<a href="#" class="tagged-user-link text-decoration-none text-primary fw-semibold" data-email="${u.email}">${u.name}</a>`
                : (typeof u === 'string' ? `<span class="fw-semibold">${u}</span>` : '')
        ).join(', ');
    }

    // --- TAGGED PETS LOGIC (ownerHome style, clickable, with image) ---
    let taggedPetsHtml = '';
    if (Array.isArray(post.tagged_pets) && post.tagged_pets.length > 0 && petInfoMap) {
        taggedPetsHtml = post.tagged_pets.map(pid => {
            const pet = petInfoMap[pid];
            if (!pet) return '';
            const img = pet.pet_img ? `media/images/petPics/${pet.pet_img}` : 'media/images/default-profile.png';
            return `<span class="d-inline-flex align-items-center me-2 mb-1 p-1 px-2 rounded bg-light border tagged-pet-badge" style="gap:6px;min-width:0;cursor:pointer;" data-pet-id="${pet.pet_id}">
                <img src="${img}" alt="${pet.pet_name}" class="rounded-circle border" style="width:28px;height:28px;object-fit:cover;">
                <span class="fw-semibold text-dark" style="font-size:1rem;">${pet.pet_name}</span>
                <span class="text-muted" style="font-size:0.92rem;">${pet.pet_breed}</span>
            </span>`;
        }).join(' ');
    }

    return `
        <div class="post-card card p-3 mb-4">
            <div class="post-header d-flex align-items-center mb-3">
                <img src="${profileImg}" alt="User Profile" class="profile-img me-3" style="width:48px;height:48px;object-fit:cover;">
                <div>
                    <div class="fw-bold">${profileName}</div>
                    <div class="text-muted" style="font-size:0.9rem;">${post.poster_email || ''}</div>
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

// --- RENDER ALL SESSION USER POSTS ---
function renderSessionUserPosts(posts, user, petInfoMap) {
    const postList = $(".post-list").empty();
    if (!Array.isArray(posts) || posts.length === 0) {
        postList.html('<div class="text-danger text-center">No posts found.</div>');
        return;
    }
    posts.forEach((post, idx) => {
        postList.append(renderPostCard(post, user, idx, petInfoMap));
    });
}

// --- FETCH AND RENDER SESSION USER POSTS ON PROFILE ---
$.ajax({
    url: "phpFile/globalSide/fetchUserPosts.php",
    type: "POST",
    dataType: "json",
    success: function (response) {
        if (response.status === "success") {
            // Collect all unique pet IDs from tagged_pets across all posts
            let allPetIds = [];
            (response.posts || []).forEach(post => {
                if (Array.isArray(post.tagged_pets)) {
                    post.tagged_pets.forEach(pid => {
                        if (pid && !allPetIds.includes(pid)) allPetIds.push(pid);
                    });
                }
            });
            if (allPetIds.length > 0) {
                // Fetch pet info for all tagged pet IDs
                $.ajax({
                    url: 'phpFile/globalSide/fetchPetsByIds.php',
                    type: 'POST',
                    dataType: 'json',
                    data: { pet_ids: allPetIds },
                    success: function(petRes) {
                        let petInfoMap = {};
                        if (petRes.status === 'success' && Array.isArray(petRes.pets)) {
                            petRes.pets.forEach(pet => { petInfoMap[pet.pet_id] = pet; });
                        }
                        renderSessionUserPosts(response.posts, response.posts[0], petInfoMap);
                        // After rendering, fetch and update like/comment counts for each post
                        $(".post-card").each(function() {
                            const $card = $(this);
                            const postId = $card.find('.like-btn').data('post-id');
                            // Fetch like count and status
                            $.get('phpFile/globalSide/getPostLikeStatus.php', { post_id: postId }, function(statusRes) {
                                if (statusRes && statusRes.like_count !== undefined) {
                                    $card.find('.like-count').text(statusRes.like_count);
                                    $card.find('.like-btn').data('liked', !!statusRes.liked)
                                        .toggleClass('liked', !!statusRes.liked)
                                        .find('.postFas').toggleClass('fa-solid fa-thumbs-up text-primary', !!statusRes.liked)
                                        .toggleClass('fa-regular fa-thumbs-up', !statusRes.liked);
                                    $card.find('.like-btn-text').text(statusRes.liked ? 'Liked' : 'Like');
                                }
                            }, 'json');
                            // Fetch comment count
                            $.get('phpFile/globalSide/fetchComments.php', { post_id: postId }, function(res) {
                                if (res && Array.isArray(res.comments)) {
                                    $card.find('.comment-count').text(res.comments.length);
                                }
                            }, 'json');
                        });
                    },
                    error: function() {
                        renderSessionUserPosts(response.posts, response.posts[0], {});
                    }
                });
            } else {
                renderSessionUserPosts(response.posts, response.posts[0], {});
            }
        } else {
            $(".post-list").html(`<div class="text-danger text-center">${response.message}</div>`);
        }
    },
    error: function () {
        $(".post-list").html(`<div class="text-danger text-center">Failed to fetch posts.</div>`);
    }
});



$("#savePetBtn").on("click", function () {
    let pet_name = $("#pet_name").val();
    let pet_type = $("#pet_type").val();
    let pet_breed = $("#pet_breed").val();
    let pet_birthdate = $("#pet_birthdate").val();
    let pet_gender = $("#pet_gender").val();
    let pet_color = $("#pet_color").val();
    let pet_eye_color = $("#pet_eye_color").val();
    let pet_allergies = $("#pet_allergies").val();
    let pet_medical_conditions = $("#pet_medical_conditions").val();
    let pet_weight = $("#pet_weight").val();
    let pet_size = $("#pet_size").val();

    // Convert images to base64
    function getBase64(fileInputId, callback) {
        const file = document.getElementById(fileInputId).files[0];
        if (!file) return callback("");
        const reader = new FileReader();
        reader.onloadend = () => callback(reader.result);
        reader.readAsDataURL(file);
    }

    getBase64("pet_img", function (pet_img_base64) {
        getBase64("pet_vaccine_img", function (pet_vaccine_img_base64) {
            $.ajax({
                url: "phpFile/userSide/insertPet.php",
                type: "POST",
                dataType: "json",
                data: {
                    pet_name,
                    pet_type,
                    pet_breed,
                    pet_birthdate,
                    pet_gender,
                    pet_color,
                    pet_eye_color,
                    pet_allergies,
                    pet_medical_conditions,
                    pet_weight,
                    pet_size,
                    pet_img: pet_img_base64,
                    pet_vaccine_img: pet_vaccine_img_base64
                },
                success: function (response) {
                    if (response.status === "success") {
                        alert(response.message);
                        location.reload();
                    } else {
                        alert(response.message);
                    }
                },
                error: function () {
                    alert("Something went wrong.");
                }
            });
        });
    });
});



$("#logOutBtn").on("click", function () {
    $.ajax({
        url: "phpFile/globalSide/logout.php",
        type: "POST",
        success: function () {
            window.location.href = "index.html";
        },
        error: function () {
            alert("Logout failed. Please try again.");
        }
    });
});

// --- LIKE BUTTON HANDLER (sync with backend like status/count, always trust backend) ---
$(document).off('click', '.like-btn').on('click', '.like-btn', function() {
    const $btn = $(this);
    const postId = $btn.data('post-id');
    let liked = !$btn.data('liked');
    $btn.data('liked', liked);
    $btn.toggleClass('liked', liked);
    // Always remove both thumb classes first, then add the correct one
    $btn.find('.postFas')
        .removeClass('fa-solid fa-thumbs-up text-primary fa-regular fa-thumbs-up')
        .addClass(liked ? 'fa-solid fa-thumbs-up text-primary' : 'fa-regular fa-thumbs-up');
    $btn.find('.like-btn-text').text(liked ? 'Liked' : 'Like');
    // Instantly update like count in UI
    let $count = $btn.find('.like-count');
    let count = parseInt($count.text()) || 0;
    $count.text(liked ? count + 1 : Math.max(0, count - 1));
    // Send to backend
    $.post('phpFile/globalSide/togglePostLike.php', { post_id: postId }, function(res) {
        // Always fetch accurate like status/count from backend and update UI
        $.get('phpFile/globalSide/getPostLikeStatus.php', { post_id: postId }, function(statusRes) {
            if (statusRes && statusRes.like_count !== undefined) {
                $btn.find('.like-count').text(statusRes.like_count);
                $btn.data('liked', !!statusRes.liked);
                $btn.toggleClass('liked', !!statusRes.liked);
                $btn.find('.postFas')
                    .removeClass('fa-solid fa-thumbs-up text-primary fa-regular fa-thumbs-up')
                    .addClass(!!statusRes.liked ? 'fa-solid fa-thumbs-up text-primary' : 'fa-regular fa-thumbs-up');
                $btn.find('.like-btn-text').text(statusRes.liked ? 'Liked' : 'Like');
                // --- LOG LIKE/UNLIKE ACTIVITY ---
                // Always fetch session email before logging
                $.get('phpFile/globalSide/getSessionEmail.php', function(res) {
                    var userEmail = res && res.email ? res.email : '';
                    if (userEmail) {
                        $.post('phpFile/globalSide/logSessionActivity.php', {
                            user_email: userEmail,
                            activity_type: 'like',
                            activity: statusRes.liked ? 'like' : 'unlike',
                            activity_description: statusRes.liked ? 'Liked a post' : 'Unliked a post',
                            act_id: 0,
                            post_id: postId
                        });
                    }
                }, 'json');
            }
        }, 'json');
    }, 'json');
});

// --- COMMENT MODAL LOGIC (matching ownerHome.js, for ownerProfile.js) ---
let currentCommentPostId = null;

function renderComments(comments) {
    if (!Array.isArray(comments) || comments.length === 0) {
        $('#commentModalBody').html('<div class="p-3 text-muted">No comments yet.</div>');
        return;
    }
    let html = '<div class="list-group">';
    comments.forEach(c => {
        let img = c.user_img ? `media/images/profiles/${c.user_img}` : 'media/images/default-profile.png';
        let name = (c.user_fname && c.user_lname) ? `${c.user_fname} ${c.user_lname}` : c.user_email;
        html += `<div class="list-group-item d-flex align-items-start gap-2">
            <img src="${img}" alt="Profile" class="rounded-circle me-2" style="width:40px;height:40px;object-fit:cover;">
            <div>
                <div><strong>${name}</strong> <span class="text-muted small">${c.created_at}</span></div>
                <div>${c.comment}</div>
            </div>
        </div>`;
    });
    html += '</div>';
    $('#commentModalBody').html(html);
}

function fetchAndRenderComments(postId) {
    $.get('phpFile/globalSide/fetchComments.php', { post_id: postId }, function(res) {
        renderComments(res.comments);
        // Update comment count in UI
        const $postCard = $(`.post-card .like-btn[data-post-id='${postId}']`).closest('.post-card');
        if ($postCard.length && res.comments) {
            let $count = $postCard.find('.comment-count');
            $count.text(res.comments.length);
        }
    }, 'json');
}

$(document).on('click', '.post-actions .btn-light:has(.fa-comment)', function() {
    const $postCard = $(this).closest('.post-card');
    let postId = null;
    const $likeBtn = $postCard.find('.like-btn');
    if ($likeBtn.length) postId = $likeBtn.data('post-id');
    if (!postId) return;
    currentCommentPostId = postId;
    $('#newCommentInput').val('');
    fetchAndRenderComments(postId);
    $('#commentModal').modal('show');
});

$('#submitCommentBtn').on('click').on('click', function() {
    const comment = $('#newCommentInput').val().trim();
    if (!comment || !currentCommentPostId) return;
    // Fetch session email from backend before posting comment
    $.get('phpFile/globalSide/getSessionEmail.php', function(res) {
        const userEmail = res && res.email ? res.email : '';
        if (!userEmail) return;
        // --- Optimistically update comment count in UI ---
        const $postCard = $(`.post-card .like-btn[data-post-id='${currentCommentPostId}']`).closest('.post-card');
        if ($postCard.length) {
            let $count = $postCard.find('.comment-count');
            let count = parseInt($count.text()) || 0;
            $count.text(count + 1);
        }
        // Clear input instantly for better UX
        $('#newCommentInput').val('');
        $.ajax({
            url: 'phpFile/globalSide/insertComment.php',
            method: 'POST',
            data: {
                post_id: currentCommentPostId,
                user_email: userEmail,
                comment: comment
            },
            success: function(res) {
                fetchAndRenderComments(currentCommentPostId);
                // --- LOG COMMENT ACTIVITY ---
                var commentId = (res && res.comment_id) ? res.comment_id : 0;
                $.post('phpFile/globalSide/logSessionActivity.php', {
                    user_email: userEmail,
                    activity_type: 'comment',
                    activity: 'post_comment',
                    activity_description: 'Commented on a post',
                    act_id: commentId,
                    post_id: currentCommentPostId
                });
            },
            error: function() {
                // On error, revert optimistic update
                if ($postCard.length) {
                    let $count = $postCard.find('.comment-count');
                    let count = parseInt($count.text()) || 1;
                    $count.text(Math.max(0, count - 1));
                }
            }
        });
    }, 'json');
});

// --- REPORT BUTTON HANDLER ---
$(document).on('click', '.report-btn', function() {
    const postId = $(this).data('post-id');
    const reason = prompt('Please provide a reason for reporting this post:', 'Inappropriate or offensive content');
    if (reason === null || !reason.trim()) return;
    $.ajax({
        url: 'phpFile/globalSide/reportPost.php',
        method: 'POST',
        data: { post_id: postId, reason: reason.trim() },
        dataType: 'json',
        success: function(res) {
            alert(res.message);
        },
        error: function() {
            alert('Failed to report the post.');
        }
    });
});

// --- MEDIA MODAL LOGIC ---
$(document).on('click', '.post-media-thumb', function() {
    const postIdx = parseInt($(this).data('post-idx'));
    let mediaIdx = parseInt($(this).data('media-idx'));
    const $postCard = $(this).closest('.post-card');
    const mediaArr = [];
    $postCard.find('.post-media-thumb').each(function() {
        mediaArr.push({
            src: $(this).is('img') ? $(this).attr('src') : $(this).find('source').attr('src'),
            type: $(this).is('img') ? 'image' : 'video'
        });
    });
    function renderMedia(idx) {
        let m = mediaArr[idx];
        let html = '';
        if (m.type === 'video') {
            html = `<video controls style="max-width:100%;max-height:70vh;"><source src="${m.src}"></video>`;
        } else {
            html = `<img src="${m.src}" class="img-fluid" style="max-width:100%;max-height:70vh;">`;
        }
        $('#mediaModal .modal-dialog').html(`<div class="modal-content"><div class="modal-body text-center">${html}</div></div>`);
    }
    renderMedia(mediaIdx);
    $('#mediaModal').modal('show');
});

// --- CLICK HANDLER FOR PROFILE NAME LINK ---
$(document).on('click', '.profile-name-link', function(e) {
    e.preventDefault();
    // Use poster_email from the post card's context
    const $postCard = $(this).closest('.post-card');
    const email = $postCard.find('.text-muted').first().text().trim();
    if (email) {
        window.location.href = `otherProfile.html?email=${encodeURIComponent(email)}`;
    }
});

// --- CLICK HANDLER FOR TAGGED USER LINK ---
$(document).on('click', '.tagged-user-link', function(e) {
    e.preventDefault();
    const email = $(this).attr('data-email'); // Use attr for reliability
    console.log('Tagged user email:', email); // Debug log
    if (email) {
        window.location.href = `otherProfile.html?email=${encodeURIComponent(email)}`;
    }
});

// --- PET DETAILS MODAL (append if not present) ---
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
$(document).on('click', '.tagged-pet-badge', function() {
    const petId = $(this).data('pet-id');
    if (!petId) return;
    // Use the last loaded petInfoMap (set after rendering posts)
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

// --- After rendering posts, store petInfoMap globally for modal lookup ---
function renderSessionUserPosts(posts, user, petInfoMap) {
    window._lastTaggedPetMap = petInfoMap || {};
    const postList = $(".post-list").empty();
    if (!Array.isArray(posts) || posts.length === 0) {
        postList.html('<div class="text-danger text-center">No posts found.</div>');
        return;
    }
    posts.forEach((post, idx) => {
        postList.append(renderPostCard(post, user, idx, petInfoMap));
    });
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
        renderNotifications(res.notifications);
    }, 'json');
}

function formatNotificationTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return diffSec + ' seconds ago';
    if (diffSec < 3600) return Math.floor(diffSec / 60) + ' minutes ago';
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + ' hours ago';
    if (diffSec < 604800) return Math.floor(diffSec / 86400) + ' days ago';
    return date.toLocaleString();
}

$('#bellIcon').on('click', function() {
    fetchNotifications();
    // You may also want to fetch friend requests here if needed
});

// --- NOTIFICATION POST MODAL (append if not present) ---
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
    // Mark notification as read (is_read = 1) for both comment and like
    if (notificationId) {
        $.post('phpFile/globalSide/markNotificationRead.php', { notification_id: notificationId });
        // Optionally, update UI to remove bold or highlight
        $(this).removeClass('fw-bold');
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

// --- FRIEND REQUESTS LOGIC FOR BELL DROPDOWN ---
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
    // Always remove and re-insert friend requests section as the very first child of bellDropdown
    $('#bellDropdown .friend-requests-list').remove();
    $('#bellDropdown').prepend('<div class="friend-requests-list mb-2"></div>');
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

// --- CLICK HANDLER FOR BELL ICON (FETCH NOTIFICATIONS AND FRIEND REQUESTS) ---
$('#bellIcon').on('click', function() {
    fetchNotifications();
    fetchFriendRequests();
});

// --- CLICK HANDLER FOR ACCEPT FRIEND BUTTON ---
$(document).on('click', '.accept-friend-btn', function() {
    const $btn = $(this);
    const senderEmail = $btn.data('email');
    if (!senderEmail) return;
    $.ajax({
        url: 'phpFile/globalSide/handleFriendRequestAction.php',
        method: 'POST',
        data: { sender_email: senderEmail, action: 'accept' },
        dataType: 'json',
        success: function(res) {
            alert(res.message);
            fetchFriendRequests();
            fetchNotifications();
        },
        error: function() {
            alert('Failed to accept friend request.');
        }
    });
});

// --- CLICK HANDLER FOR REJECT FRIEND BUTTON ---
$(document).on('click', '.reject-friend-btn', function() {
    const $btn = $(this);
    const senderEmail = $btn.data('email');
    if (!senderEmail) return;
    $.ajax({
        url: 'phpFile/globalSide/handleFriendRequestAction.php',
        method: 'POST',
        data: { sender_email: senderEmail, action: 'reject' },
        dataType: 'json',
        success: function(res) {
            alert(res.message);
            fetchFriendRequests();
            fetchNotifications();
        },
        error: function() {
            alert('Failed to reject friend request.');
        }
    });
});

// --- SEARCH MODAL LOGIC ---
if ($('#searchModal').length === 0) {
    $('body').append(`
        <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered"> <!-- Changed to modal-xl for wider modal -->
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

// --- SEARCH MODAL LOGIC ---
$('#searchInputModal').on('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = $(this).val().trim();
        if (!query) return;
        // Close the search modal if open
        const searchModal = bootstrap.Modal.getInstance(document.getElementById('searchModal'));
        if (searchModal) searchModal.hide();
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
// Call on page load if #recentSearches exists
$(document).ready(function() {
    if ($('#recentSearches').length) fetchRecentSearches();
});

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


