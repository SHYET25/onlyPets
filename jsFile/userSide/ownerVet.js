let selectedFiles = [];
let friendSuggestions = [];
let taggedUsersArr = [];
let petSuggestions = [];
let taggedPetsArr = [];
let currentReplyPostId = null;

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Show preview modal with scope and tagging
$('#postButton').on('click', function () {
    const caption = $('#postText').val();
    selectedFiles = Array.from($('#postMedia')[0].files);

    $('#previewCaption').text(caption);
    $('#previewMedia').empty();

    selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            let element;
            if (file.type.startsWith('image/')) {
                element = $('<img>', { src: e.target.result, class: 'img-thumbnail', width: 120 });
            } else if (file.type.startsWith('video/')) {
                element = $('<video>', { src: e.target.result, width: 160, controls: true });
            }
            $('#previewMedia').append(element);
        };
        reader.readAsDataURL(file);
    });

    // Reset tagging fields
    $('#taggedUsers').val('');
    $('#taggedPets').val('');
    taggedUsersArr = [];
    taggedPetsArr = [];

    // Show the preview modal
    const modal = new bootstrap.Modal(document.getElementById('postPreviewModal'));
    modal.show();
});

// Tag people autocomplete
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
    fetchFriendSuggestions().done(function(res) {
        if (res.status === 'success' && Array.isArray(res.friends)) {
            friendSuggestions = res.friends;
        }
    });
    $('#taggedUsers').on('input focus', function() {
        const input = $(this).val();
        const parts = input.split(',');
        const last = parts[parts.length - 1].trim();
        if (!last) {
            $('#taggedUsersSuggestions').hide();
            return;
        }
        const matches = filterFriendSuggestions(last);
        renderTaggedUsersSuggestions(matches);
    });
    $(document).on('click', '.tag-suggestion-item', function() {
        const email = $(this).data('email');
        const name = $(this).data('name');
        if (!taggedUsersArr.some(u => u.email === email)) {
            taggedUsersArr.push({ name, email });
        }
        const names = taggedUsersArr.map(u => u.name);
        $('#taggedUsers').val(names.join(', ') + (names.length ? ', ' : ''));
        $('#taggedUsersSuggestions').hide();
        $('#taggedUsers').focus();
    });
    $('#taggedUsers').on('input', function() {
        const inputNames = $(this).val().split(',').map(s => s.trim()).filter(Boolean);
        taggedUsersArr = taggedUsersArr.filter(u => inputNames.includes(u.name));
    });
    $('#taggedUsers').on('blur', function() {
        setTimeout(() => $('#taggedUsersSuggestions').hide(), 200);
    });
});

// Tag pets autocomplete
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
    fetchUserPets().done(function(res) {
        if (res.status === 'success' && Array.isArray(res.pets)) {
            petSuggestions = res.pets;
        }
    });
    $('#taggedPets').on('input focus', function() {
        const input = $(this).val();
        const parts = input.split(',');
        const last = parts[parts.length - 1].trim();
        if (!last) {
            $('#taggedPetsSuggestions').hide();
            return;
        }
        const matches = filterPetSuggestions(last);
        renderTaggedPetsSuggestions(matches);
    });
    $(document).on('click', '.pet-suggestion-item', function() {
        const petName = $(this).find('.fw-bold').text().trim();
        const petBreed = $(this).find('.text-secondary').text().trim();
        const petObj = petSuggestions.find(p => p.pet_name === petName && p.pet_breed === petBreed);
        const petId = petObj ? petObj.pet_id : null;
        if (petId && !taggedPetsArr.some(p => p.id === petId)) {
            taggedPetsArr.push({ id: petId, name: petName, breed: petBreed });
        }
        let inputVal = $('#taggedPets').val();
        let parts = inputVal.split(',');
        parts[parts.length - 1] = ' ' + petName;
        let newVal = parts.join(',').replace(/^\s+|\s+$/g, '');
        $('#taggedPets').val(newVal);
        $('#taggedPetsSuggestions').hide();
        $('#taggedPets').focus();
    });
    $('#taggedPets').on('input', function() {
        const inputNames = $(this).val().split(',').map(s => s.trim()).filter(Boolean);
        taggedPetsArr = taggedPetsArr.filter(p => inputNames.includes(p.name));
    });
    $('#taggedPets').on('blur', function() {
        setTimeout(() => $('#taggedPetsSuggestions').hide(), 200);
    });
});

// Submit post with scope and tags
$('#submitPost').on('click', async function () {
    const caption = $('#postText').val();
    const scope = $('#postScopeMain').val();
    const tagged = JSON.stringify(taggedUsersArr);
    const taggedPetIds = taggedPetsArr.map(p => p.id).filter(Boolean);

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
        url: 'phpFile/globalSide/uploadQuestion.php',
        method: 'POST',
        dataType: 'json',
        data: {
            caption,
            scope,
            tagged,
            taggedPets: JSON.stringify(taggedPetIds),
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

function loadAllVets() {
    $.get('phpFile/globalSide/getAllVetsWithFollowStatus.php', function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        const $list = $('#friendList');
        $list.empty();
        if (res.status === 'success' && res.vets.length) {
            res.vets.filter(vet => !vet.is_followed).forEach(function(vet) {
                $list.append(`
                    <li class="vet-list-item d-flex align-items-center">
                        <img src="media/images/profiles/${vet.img || 'default-profile.png'}" class="vet-avatar" alt="${vet.name}">
                        <div class="vet-info">
                            <div class="vet-name">${vet.name}</div>
                            <div class="vet-license">${vet.license || ''}</div>
                        </div>
                        <button class="btn btn-outline-primary vet-action-btn follow-btn" data-vet-id="${vet.id}">Follow</button>
                    </li>
                `);
            });
            if ($list.children().length === 0) {
                $list.html('<li class="list-group-item text-muted border-0 bg-transparent">You are following all vets.</li>');
            }
        } else {
            $list.html('<li class="list-group-item text-muted border-0 bg-transparent">No vets found.</li>');
        }
    });
}

function loadFollowedVets() {
    $.get('phpFile/globalSide/getAllVetsWithFollowStatus.php', function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        const $list = $('#friendList');
        $list.empty();
        if (res.status === 'success' && res.vets.length) {
            res.vets.filter(vet => vet.is_followed).forEach(function(vet) {
                $list.append(`
                    <li class="vet-list-item d-flex align-items-center">
                        <img src="media/images/profiles/${vet.img || 'default-profile.png'}" class="vet-avatar" alt="${vet.name}">
                        <div class="vet-info">
                            <div class="vet-name">${vet.name}</div>
                            <div class="vet-license">${vet.license || ''}</div>
                        </div>
                        <button class="btn btn-outline-success vet-action-btn follow-btn" data-vet-id="${vet.id}">Unfollow</button>
                    </li>
                `);
            });
            if ($list.children().length === 0) {
                $list.html('<li class="list-group-item text-muted border-0 bg-transparent">You are not following any vets yet.</li>');
            }
        } else {
            $list.html('<li class="list-group-item text-muted border-0 bg-transparent">No vets found.</li>');
        }
    });
}

// Toggle button handlers
$(document).on('click', '#showAllVetsBtn', function() {
    $('#showAllVetsBtn').addClass('active');
    $('#showFollowedVetsBtn').removeClass('active');
    loadAllVets();
});
$(document).on('click', '#showFollowedVetsBtn', function() {
    $('#showFollowedVetsBtn').addClass('active');
    $('#showAllVetsBtn').removeClass('active');
    loadFollowedVets();
});

// Initial load
$(document).ready(function() {
    loadAllVets();
});

// Follow/Unfollow logic (already in your code, but make sure to reload list after action)
$(document).on('click', '.follow-btn', function() {
    const $btn = $(this);
    const vetId = $btn.data('vet-id');
    const action = $btn.text().trim() === 'Follow' ? 'follow' : 'unfollow';

    $.post('phpFile/userSide/followVet.php', { vet_id: vetId, action }, function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        if (res.status === 'success') {
            // Reload the current list
            if ($('#showAllVetsBtn').hasClass('active')) {
                loadAllVets();
            } else {
                loadFollowedVets();
            }
        } else {
            alert(res.message);
        }
    });
});

$('#postScopeMain').on('change', function() {
    if ($(this).val() === 'exclusive') {
        // Show and populate the dropdown
        $('#followedVetsDropdown').show().prop('disabled', false);
        // Fetch followed vets
        $.get('phpFile/globalSide/getFollowedVets.php', function(res) {
            if (typeof res === 'string') res = JSON.parse(res);
            const $dropdown = $('#followedVetsDropdown');
            $dropdown.empty();
            if (res.status === 'success' && res.vets.length) {
                $dropdown.append('<option value="">Select a Vet</option>');
                res.vets.forEach(function(vet) {
                    $dropdown.append(`<option value="${vet.id}">${vet.name}</option>`);
                });
            } else {
                $dropdown.append('<option value="">No followed vets found</option>');
            }
        });
    } else {
        $('#followedVetsDropdown').hide().prop('disabled', true);
    }
});

// Optional: On modal open, reset dropdown
$('#postPreviewModal').on('show.bs.modal', function() {
    $('#followedVetsDropdown').hide().prop('disabled', true);
    $('#postScopeMain').val('public');
});

function renderQuestions(questions) {
    const $container = $('#personalizedContainer');
    $container.empty();
    if (!questions.length) {
        $container.html('<div class="alert alert-info mt-4">No questions yet.</div>');
        return;
    }
    questions.forEach(q => {
        let mediaHtml = '';
        if (Array.isArray(q.media)) {
            q.media.forEach(file => {
                const ext = file.split('.').pop().toLowerCase();
                if (['jpg','jpeg','png','gif','webp'].includes(ext)) {
                    mediaHtml += `<img src="media/images/questions/${file}" class="img-fluid rounded mb-2" style="max-width:180px;max-height:180px;margin-right:8px;">`;
                } else if (['mp4','webm','ogg'].includes(ext)) {
                    mediaHtml += `<video src="media/images/questions/${file}" controls class="rounded mb-2" style="max-width:180px;max-height:180px;margin-right:8px;"></video>`;
                }
            });
        }
        let taggedUsers = '';
        if (Array.isArray(q.tagged_users) && q.tagged_users.length) {
            taggedUsers = `<div class="mb-1"><i class="fas fa-user-tag text-primary"></i> ${q.tagged_users.map(u => u.name || u.email || u).join(', ')}</div>`;
        }
        let taggedPets = '';
        if (Array.isArray(q.tagged_pets) && q.tagged_pets.length) {
            taggedPets = `<div class="mb-1"><i class="fas fa-paw text-warning"></i> ${q.tagged_pets.map(p => p.name || p).join(', ')}</div>`;
        }
        let vetInfo = '';
        if (q.scope === 'exclusive' && q.exclusive_vet) {
            vetInfo = `
                <div class="d-flex align-items-center mb-2">
                    <img src="media/images/profiles/${q.exclusive_vet.vet_img || 'default-profile.png'}" class="rounded-circle me-2" width="36" height="36">
                    <div>
                        <div class="fw-bold">${q.exclusive_vet.vet_fname} ${q.exclusive_vet.vet_lname}</div>
                        <div class="text-muted" style="font-size:0.93em;">${q.exclusive_vet.vet_license || ''}</div>
                    </div>
                </div>
            `;
        }

        $container.append(`
          <div class="post-card mb-4 p-3 shadow-sm" style="background: #fafdff; border-radius: 18px; box-shadow: 0 2px 12px #38b6ff22; border: 2px solid #38b6ff;">
            <div class="post-header d-flex align-items-center mb-2">
              <img src="media/images/profiles/${q.user_img && q.user_img.trim() ? q.user_img : 'default-profile.png'}" class="profile-img me-3 shadow" alt="User" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 3px solid #38b6ff;">
              <div>
                <div class="fw-bold" style="font-size: 1.08rem; color: #1976d2;">
                  ${q.user_fname ? q.user_fname + ' ' + q.user_lname : q.asker_email}
                </div>
                <div class="text-muted" style="font-size: 0.93rem;">${q.date_posted}</div>
              </div>
              <span class="badge ms-auto" style="background: linear-gradient(90deg,#38b6ff 0%,#85d2ff 100%); color: #fff; font-weight:600; font-size:0.97rem;">
                ${q.scope === 'exclusive' ? 'Followed You' : 'Public'}
              </span>
            </div>
            ${vetInfo}
            <div class="post-content mb-2" style="font-size: 1.13rem; color: #222;">${q.question}</div>
            ${mediaHtml ? `<div class="mb-2">${mediaHtml}</div>` : ''}
            ${taggedUsers}
            ${taggedPets}
            <div class="d-flex justify-content-end align-items-center">
              <button class="btn btn-gradient-reply open-reply-modal mt-2 position-relative" data-post-id="${q.id}">
                <i class="fas fa-reply me-1"></i> Reply
                ${q.reply_count > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:0.75rem;">${q.reply_count}</span>` : ''}
              </button>
            </div>
          </div>
        `);
    });
}

// Fetch and display on page load
$(document).ready(function() {
    $.get('phpFile/globalSide/getQuestions.php', function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        if (res.status === 'success') {
            renderQuestions(res.questions);
        }
    });
});

$('#submitAppointment').on('click', function(e) {
    e.preventDefault();
    const vet_id = $('#vetSelect').val();
    const pet_name = $('#petName').val();
    const appointment_date = $('#appointmentDate').val();
    const appointment_time = $('#appointmentTime').val();
    const reason = $('#petCondition').val();

    $.post('phpFile/globalSide/bookAppointment.php', {
        vet_id, pet_name, appointment_date, appointment_time, reason
    }, function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        alert(res.message);
        if (res.status === 'success') {
            $('#appointmentModal').modal('hide');
            loadAppointments();
        }
    });
});

function loadAppointments() {
    $.get('phpFile/globalSide/getAppointment.php', function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        const $list = $('#appointmentList');
        const $badge = $('#appointmentCard .badge');
        $list.empty();
        if (res.status === 'success' && res.appointments.length) {
            $badge.text(res.appointments.length);
            res.appointments.forEach(app => {
                $list.append(`
                    <li class="appoints d-flex align-items-center mb-3">
                        <img src="media/images/petPics/${app.pet_img || 'default-profile.png'}" alt="${app.pet_name}" class="rounded-circle me-3" width="40" height="40">
                        <div class="text-start">
                            <strong>${app.pet_name}</strong>
                            <p class="mb-0">${app.reason || ''}</p>
                            <small>${app.appointment_date} at ${app.appointment_time}</small><br>
                            <span class="text-muted">with Dr. ${app.vet_fname} ${app.vet_lname}</span>
                        </div>
                    </li>
                    <hr>
                `);
            });
        } else {
            $badge.text('0');
            $list.html('<li class="text-muted">No appointments yet.</li>');
        }
    });
}

// Call this on page load and after booking an appointment
$(document).ready(function() {
    loadAppointments();
});

function populateVetSelect() {
    $.get('phpFile/globalSide/getFollowedVets.php', function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        const $vetSelect = $('#vetSelect');
        $vetSelect.empty();
        $vetSelect.append('<option value="" disabled selected>Select a Vet</option>');
        if (res.status === 'success' && res.vets.length) {
            res.vets.forEach(function(vet) {
                $vetSelect.append(`
                    <option value="${vet.id}">
                        Dr. ${vet.name} ${vet.license ? '(' + vet.license + ')' : ''}
                    </option>
                `);
            });
        } else {
            $vetSelect.append('<option value="" disabled>No followed vets found</option>');
        }
    });
}

function populatePetDropdown() {
    $.get('phpFile/globalSide/fetchUserPets.php', function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        const $petSelect = $('#petName');
        $petSelect.empty();
        $petSelect.append('<option value="" disabled selected>Select a Pet</option>');
        if (res.status === 'success' && res.pets.length) {
            res.pets.forEach(function(pet) {
                $petSelect.append(`<option value="${pet.pet_id}">${pet.pet_name} (${pet.pet_breed})</option>`);
            });
        } else {
            $petSelect.append('<option value="" disabled>No pets found</option>');
        }
    });
}

// Populate when the modal is opened
$('#appointmentModal').on('show.bs.modal', function() {
    populateVetSelect();
    populatePetDropdown();
});

$(document).on('click', '.open-reply-modal', function() {
    currentReplyPostId = $(this).data('post-id');
    $('#replyModalReplies').html('<div class="text-muted">Loading...</div>');
    $('#replyModalInput').val('');
    // Fetch replies for this post
    $.get('phpFile/globalSide/getReplies.php', { post_id: currentReplyPostId }, function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        if (res.status === 'success' && res.replies.length) {
            $('#replyModalReplies').html(
                res.replies.map(r =>
                    `<div class="reply mb-2"><strong>${r.author}:</strong> ${r.reply_text} <br><small class="text-muted">${r.created_at}</small></div>`
                ).join('')
            );
        } else {
            $('#replyModalReplies').html('<div class="text-muted">No replies yet.</div>');
        }
    });
    // Remove the badge
    $(this).find('.badge').remove();
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('replyModal'));
    modal.show();
});

$('#replyModalForm').on('submit', function(e) {
    e.preventDefault();
    const replyText = $('#replyModalInput').val().trim();
    if (!replyText || !currentReplyPostId) return;
    $.post('phpFile/globalSide/saveReply.php', { post_id: currentReplyPostId, reply_text: replyText }, function(res) {
        if (typeof res === 'string') res = JSON.parse(res);
        if (res.status === 'success') {
            // Reload replies
            $.get('phpFile/globalSide/getReplies.php', { post_id: currentReplyPostId }, function(res) {
                if (typeof res === 'string') res = JSON.parse(res);
                if (res.status === 'success' && res.replies.length) {
                    $('#replyModalReplies').html(
                        res.replies.map(r =>
                            `<div class="reply mb-2"><strong>${r.author}:</strong> ${r.reply_text} <br><small class="text-muted">${r.created_at}</small></div>`
                        ).join('')
                    );
                } else {
                    $('#replyModalReplies').html('<div class="text-muted">No replies yet.</div>');
                }
            });
            $('#replyModalInput').val('');
        } else {
            alert(res.message || 'Failed to reply.');
        }
    });
});