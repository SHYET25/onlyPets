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
