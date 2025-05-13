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
                    <li class="list-group-item d-flex align-items-center" style="cursor:pointer;">
                        <img src="media/images/petPics/${info.pet_img}" alt="${info.pet_name}" class="rounded-circle me-3" style="width: 60px; height: 60px; object-fit: cover;">
                        <div class="text-center flex-grow-1">
                            <div><strong>${info.pet_name}</strong></div>
                            <div class="text-muted">${info.pet_breed}</div>
                        </div>
                    </li>
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


