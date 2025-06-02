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

$.ajax({
    url: "phpFile/globalSide/fetchUserPosts.php",
    type: "POST",
    dataType: "json",
    success: function (response) {
        const postList = $(".post-list").empty();

        if (response.status === "success") {
            response.posts.forEach(post => {
                const mediaFiles = post.post_images ? JSON.parse(post.post_images) : [];

                const mediaHtml = mediaFiles.map(file => {
                    const fileExtension = file.split('.').pop().toLowerCase();
                    const fileUrl = `media/images/posts/${file.trim()}`;

                    if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
                        return `
                            <div class="col-4">
                                <img src="${fileUrl}" alt="Post Image" class="img-fluid rounded img-thumbnail"
                                     data-bs-toggle="modal" data-bs-target="#imageModal" onclick="showImage(this)">
                            </div>
                        `;
                    }

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

                    return '';
                }).join("");

                const postScopeIcon = post.post_scope === "public"
                    ? `<span id="postScopeContainer"><i id="postScope" class="fa-solid fa-earth-americas"></i></span>`
                    : `<span id="postScopeContainer"><i id="postScope" class="fa-solid fa-user-group"></i></span>`;

                const profileImg = post.user_img
                    ? `media/images/profiles/${post.user_img}`
                    : `media/images/default.jpg`;

                const postCard = $(`
                    <div class="post-card card p-3 mb-4">
                        <div class="post-header d-flex align-items-center mb-3">
                            <img src="${profileImg}" alt="${post.user_fname}" class="profile-img me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">
                            <div>
                                <div class="d-flex align-items-center">
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

                postList.append(postCard);
            });
        } else {
            postList.html(`<div class="text-danger text-center">${response.message}</div>`);
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


