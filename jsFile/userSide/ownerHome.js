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




