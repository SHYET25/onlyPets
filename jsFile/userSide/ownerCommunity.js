$(document).ready(function () {
    // Fetch session info
    $.get('phpFile/globalSide/getSessionInfo.php', function (sessionData) {
        if (!sessionData || sessionData.status !== 'success' || !sessionData.data || !sessionData.data.user_email) {
            showGroupButtons();
            return;
        }
        // Now check group membership using getUserGroups.php
        $.get('phpFile/globalSide/getUserGroups.php', function (groupData) {
            if (!groupData || groupData.error || !groupData.user_email) {
                showGroupButtons();
                return;
            }
            if (!groupData.in_group) {
                // Hide left, right, and middle content
                $('#leftContent').hide();
                $('#rightContent').hide();
                $('#middleContent').hide();
                // Show join/create group buttons in center
                showGroupButtons();
            } else {
                // User is in a group, render user groups
                renderUserGroups(groupData.groups, sessionData.data.user_email);
            }
        }).fail(function () {
            showGroupButtons();
        });
    }).fail(function () {
        showGroupButtons();
    });

    function showGroupButtons() {
    // Inject the buttons into #main
    $('#main').html(`
        <div style="min-height: 80vh; display: flex; align-items: center; justify-content: flex-end;">
            <div class="d-flex flex-row justify-content-end align-items-center" style="margin-right: -10vw;">
                <button id="joinGroupButton" class="btn btn-primary btn-lg mx-3" style="width: 320px; height: 120px; font-size: 2.2rem;">Join a Group</button>
                <button class="btn btn-success btn-lg mx-3" style="width: 320px; height: 120px; font-size: 2.2rem;" id="createGroupButton">Create a Group</button>
            </div>
        </div>
    `);

    // Reset the groupSelect dropdown (if exists)
    $('#groupSelect').html('<option value="" disabled selected>Select a Group</option>');

    // Attach click event for Join a Group button to show the modal
    $('#joinGroupButton').on('click', function() {
        showJoinGroupModal();
    });
}


    function updateGroupSelect(groups, userEmail) {
        const userGroups = groups.filter(g => Array.isArray(g.group_members) && g.group_members.includes(userEmail));
        let options = '<option value="" disabled selected>Select a Group</option>';
        userGroups.forEach(group => {
            options += `<option value="${group.group_id}">${group.group_name}</option>`;
        });
        $('#groupSelect').html(options);
    }

    function renderUserGroups(groups, userEmail) {
        // Add Create and Join Group buttons at the top
        let html = `<div class="d-flex justify-content-center mb-3 gap-2">
            <button class="btn btn-primary btn-sm rounded-pill px-4 py-2 d-flex align-items-center" id="joinGroupBtn">
                <i class="fa-solid fa-users me-2"></i> Join Group
            </button>
            <button class="btn btn-success btn-sm rounded-pill px-4 py-2 d-flex align-items-center" id="createGroupBtn">
                <i class="fa-solid fa-plus me-2"></i> Create Group
            </button>
        </div>`;
        // Find groups where user is a member
        const userGroups = groups.filter(g => Array.isArray(g.group_members) && g.group_members.includes(userEmail));
        if (userGroups.length === 0) {
            html += '<div class="text-center text-muted">You are not a member of any group.</div>';
        } else {
            userGroups.forEach(group => {
                let imgSrc = group.group_img ? `media/images/groups/${group.group_img}` : 'media/images/groups/default_group.png';
                html += `
                <div class="group-item d-flex align-items-center justify-content-between mb-3" data-group-id="${group.group_id}" style="cursor:pointer;">
                    <div class="d-flex align-items-center">
                        <img src="${imgSrc}" alt="${group.group_name}" class="group-img me-3">
                        <div>
                            <div class="fw-bold">${group.group_name}</div>
                            <div class="text-muted">${group.group_description || ''}</div>
                        </div>
                    </div>
                    <span class="badge bg-primary rounded-pill">${group.member_count} Members</span>
                </div>
                <hr>`;
            });
        }
        $(".groupCollection").html(html);
        updateGroupSelect(groups, userEmail);

        // Attach join/create group button events
        $('#createGroupBtn').off('click').on('click', function(e) {
            e.preventDefault();
            let modalEl = document.getElementById('createGroupModal');
            if (!modalEl) {
                modalEl = $('#main #createGroupModal')[0];
            }
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            } else {
                alert('Create Group modal not found in the DOM.');
            }
        });

        // Show group info modal with event details and stats
        $(document).off('click', '.group-item').on('click', '.group-item', function() {
            const groupId = $(this).data('group-id');
            showGroupInfoModal(groupId);
        });
    }

    // --- GROUP INFO MODAL LOGIC ---
    function showGroupInfoModal(groupId) {
        // Remove existing modal if present
        $('#groupInfoModal').remove();
        // Fetch group event details and stats
        $.get('phpFile/globalSide/fetchGroupEventStats.php', { group_id: groupId }, function(res) {
            let modalBody = '';
            if (res.status === 'success') {
                const group = res.group;
                const events = res.events || [];
                modalBody += `<div class="mb-3">
                    <div class="fw-bold fs-5 mb-1">${group.group_name}</div>
                    <div class="text-muted mb-2">${group.group_description || ''}</div>
                    <img src="${group.group_img ? 'media/images/groups/' + group.group_img : 'media/images/groups/default_group.png'}" alt="${group.group_name}" class="mb-3" style="width:64px;height:64px;object-fit:cover;border-radius:50%;">
                    <div class="mb-2"><span class="badge bg-primary">${group.member_count} Members</span></div>
                </div>`;
                if (events.length === 0) {
                    modalBody += '<div class="text-muted">No events for this group.</div>';
                } else {
                    events.forEach(ev => {
                        // Parse media images if available
                        let mediaHtml = '';
                        if (ev.media) {
                            let mediaArr = [];
                            try { mediaArr = JSON.parse(ev.media); } catch(e) { mediaArr = []; }
                            if (Array.isArray(mediaArr) && mediaArr.length > 0) {
                                mediaHtml = '<div class="d-flex flex-wrap gap-2 mb-2">' +
                                    mediaArr.map(img => `<img src="media/images/posts/${img}" alt="Event Image" style="width:80px;height:80px;object-fit:cover;border-radius:10px;">`).join('') +
                                    '</div>';
                            }
                        }
                        modalBody += `<div class="border rounded-3 p-3 mb-3 bg-light">
                            <div class="fw-bold mb-1">${ev.event_title || ev.title || 'Event'}</div>
                            <div class="mb-1"><i class="fa-solid fa-calendar-days me-1 text-warning"></i> ${ev.event_date || ''} <span class="ms-2"><i class="fa-solid fa-clock me-1 text-info"></i>${ev.event_time || ''}</span></div>
                            <div class="mb-1"><i class="fa-solid fa-location-dot me-1 text-danger"></i> ${ev.location_name || ''}</div>
                            <div class="mb-1"><i class="fa-solid fa-user-check text-success me-1"></i> Accepted: <b>${ev.accepted_count || 0}</b> &nbsp; <i class="fa-solid fa-user-xmark text-danger me-1"></i> Rejected: <b>${ev.rejected_count || 0}</b></div>
                            ${mediaHtml}
                            <div class="small text-muted">${ev.caption || ''}</div>
                        </div>`;
                    });
                }
            } else {
                modalBody = '<div class="text-danger">Failed to load group info.</div>';
            }
            const modalHtml = `
            <div class="modal fade" id="groupInfoModal" tabindex="-1" aria-labelledby="groupInfoModalLabel" aria-hidden="true">
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="groupInfoModalLabel">Group Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">${modalBody}</div>
                </div>
              </div>
            </div>`;
            $('body').append(modalHtml);
            const modal = new bootstrap.Modal(document.getElementById('groupInfoModal'));
            modal.show();
        }, 'json');
    }

    // Always ensure modal is present in DOM before attaching event
    if ($('#createGroupModal').length === 0) {
        $("body").append(`
        <div class="modal fade" id="createGroupModal" tabindex="-1" aria-labelledby="createGroupModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="createGroupModalLabel">Create a Group</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="createGroupForm">
                  <div class="mb-3">
                    <label for="groupName" class="form-label">Group Name</label>
                    <input type="text" class="form-control" id="groupName" required>
                  </div>
                  <div class="mb-3">
                    <label for="groupDescription" class="form-label">Group Description</label>
                    <textarea class="form-control" id="groupDescription" rows="3" required></textarea>
                  </div>
                  <div class="mb-3">
                    <label for="groupImg" class="form-label">Group Profile Image</label>
                    <input type="file" class="form-control" id="groupImg" accept="image/*">
                  </div>
                  <button type="submit" class="btn btn-success w-100">Create Group</button>
                </form>
              </div>
            </div>
          </div>
        </div>
        `);
    }

    // Attach event for both possible create group buttons
    $(document).off('click', '#createGroupBtn').on('click', '#createGroupBtn', function(e) {
        e.preventDefault();
        let modalEl = document.getElementById('createGroupModal');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    });
    $(document).off('click', '#createGroupButton').on('click', '#createGroupButton', function(e) {
        e.preventDefault();
        let modalEl = document.getElementById('createGroupModal');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    });

    // Handle form submission for group creation
    $(document).off('submit', '#createGroupForm').on('submit', '#createGroupForm', function (e) {
        e.preventDefault();
        const groupName = $('#groupName').val();
        const groupDescription = $('#groupDescription').val();
        const groupImgInput = document.getElementById('groupImg');
        let groupImgBase64 = '';
        if (groupImgInput.files && groupImgInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (event) {
                groupImgBase64 = event.target.result;
                submitGroup(groupName, groupDescription, groupImgBase64);
            };
            reader.readAsDataURL(groupImgInput.files[0]);
        } else {
            submitGroup(groupName, groupDescription, '');
        }
        function submitGroup(groupName, groupDescription, groupImgBase64) {
            $.get('phpFile/globalSide/getSessionInfo.php', function (sessionData) {
                if (!sessionData || sessionData.status !== 'success' || !sessionData.data || !sessionData.data.user_email) {
                    alert('Session error. Please log in again.');
                    return;
                }
                const userEmail = sessionData.data.user_email;
                const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const groupData = {
                    group_name: groupName,
                    group_description: groupDescription,
                    group_img: groupImgBase64,
                    created_by: userEmail,
                    member_count: 1,
                    group_members: JSON.stringify([userEmail]),
                    created_at: now,
                    updated_at: now
                };
                $.ajax({
                    url: 'phpFile/globalSide/createGroup.php',
                    method: 'POST',
                    data: groupData,
                    success: function (res) {
                        if (res && res.status === 'success') {
                            location.reload();
                        } else {
                            alert(res && res.message ? res.message : 'Failed to create group.');
                        }
                    },
                    error: function () {
                        alert('Failed to create group.');
                    }
                });
            });
        }
    });

    // Fix: Remove modal-backdrop and reset modal state on close
    $(document).on('hidden.bs.modal', '#createGroupModal', function () {
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    });

    // Change postImage input to allow multiple images/videos
    $('#postImage').attr({
        multiple: true,
        accept: 'image/*,video/*'
    });

    // Inject Post Preview Modal if not present
    if ($('#postPreviewModal').length === 0) {
        $("body").append(`
        <div class="modal fade" id="postPreviewModal" tabindex="-1" aria-labelledby="postPreviewModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content shadow-lg rounded-4 border-0">
              <div class="modal-header bg-primary text-white rounded-top-4">
                <h5 class="modal-title fw-bold" id="postPreviewModalLabel"><i class="fas fa-paper-plane me-2"></i>Invite Preview</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body p-4">
                <div class="card border-0 shadow-sm mb-3 rounded-3">
                  <div class="card-body">
                    <div id="previewMedia" class="mb-3 d-flex flex-wrap gap-2 justify-content-center"></div>
                    <div class="mb-3">
                      <label class="form-label fw-semibold"><i class="fas fa-align-left me-1"></i>Caption</label>
                      <div id="previewCaption" class="border rounded p-2 bg-light"></div>
                    </div>
                    <div class="row g-3 mb-3">
                      <div class="col-md-6">
                        <label for="previewDate" class="form-label fw-semibold"><i class="fas fa-calendar-alt me-1"></i>Event Date</label>
                        <input type="date" class="form-control" id="previewDate" required>
                      </div>
                      <div class="col-md-6">
                        <label for="previewTime" class="form-label fw-semibold"><i class="fas fa-clock me-1"></i>Event Time</label>
                        <input type="time" class="form-control" id="previewTime" required>
                      </div>
                    </div>
                    <div class="mb-2">
                      <label class="form-label fw-semibold"><i class="fas fa-map-marker-alt me-1"></i>Location</label>
                      <div id="previewLocation" class="border rounded p-2 bg-light"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-light rounded-bottom-4 d-flex justify-content-between">
                <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal"><i class="fas fa-times me-1"></i>Cancel</button>
                <button type="button" class="btn btn-success px-4 fw-bold" id="confirmPostBtn"><i class="fas fa-paper-plane me-1"></i>Send Invite</button>
              </div>
            </div>
          </div>
        </div>
        <style>
          #postPreviewModal .modal-content { border-radius: 1.5rem; }
          #postPreviewModal .modal-header { border-radius: 1.5rem 1.5rem 0 0; }
          #postPreviewModal .modal-footer { border-radius: 0 0 1.5rem 1.5rem; }
          #postPreviewModal .card { background: #f8fafc; }
          #previewMedia img, #previewMedia video { border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
        </style>
        `);
    }

    // Post button validation for group selection and content, then show preview modal
    $('#postButton').off('click').on('click', function(e) {
        e.preventDefault();
        const groupId = $('#groupSelect').val();
        const eventTitle = $('#eventTitle').val().trim();
        const caption = $('#postText').val().trim();
        const files = $('#postImage')[0].files;
        if (!groupId) {
            alert('No group selected');
            return;
        }
        if (!eventTitle) {
            alert('Event Title is required');
            return;
        }
        if (!caption && (!files || files.length === 0)) {
            alert('No content');
            return;
        }
        // Show preview modal
        let previewHtml = '';
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const url = URL.createObjectURL(file);
                if (file.type.startsWith('image/')) {
                    previewHtml += `<img src="${url}" class="img-fluid rounded mb-2" style="max-height:180px;max-width:100%;object-fit:cover;">`;
                } else if (file.type.startsWith('video/')) {
                    previewHtml += `<video src="${url}" controls class="img-fluid rounded mb-2" style="max-height:180px;max-width:100%;object-fit:cover;"></video>`;
                }
            }
        }
        $('#previewMedia').html(previewHtml);
        $('#previewCaption').text(caption);
        $('#previewDate').val('');
        $('#previewTime').val('');
        // Show location in preview if selected
        const selectedLocation = $('#addLocationBtn').data('location');
        if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
            $('#previewLocation').html(`<span class="text-monospace">Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}</span>`);
        } else {
            $('#previewLocation').html('<span class="text-muted">No location selected</span>');
        }
        // Show event title in preview (optional: you can add a preview field for event title)
        const modal = new bootstrap.Modal(document.getElementById('postPreviewModal'));
        modal.show();
    });

    // Handle post confirmation
    $(document).off('click', '#confirmPostBtn').on('click', '#confirmPostBtn', function() {
        const groupId = $('#groupSelect').val();
        const eventTitle = $('#eventTitle').val().trim();
        const caption = $('#postText').val().trim();
        const files = $('#postImage')[0].files;
        const eventDate = $('#previewDate').val();
        const eventTime = $('#previewTime').val();
        const selectedLocation = $('#addLocationBtn').data('location');
        if (!eventTitle) {
            alert('Event Title is required');
            $('#eventTitle').focus();
            return;
        }
        // Fetch session user email for participants_email
        $.get('phpFile/globalSide/getSessionInfo.php', function(sessionData) {
            if (!sessionData || sessionData.status !== 'success' || !sessionData.data || !sessionData.data.user_email) {
                alert('Session error. Please log in again.');
                return;
            }
            const userEmail = sessionData.data.user_email;
            // Prepare form data
            const formData = new FormData();
            formData.append('group_id', groupId);
            formData.append('event_title', eventTitle);
            formData.append('caption', caption);
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    formData.append('post_images[]', files[i]);
                }
            }
            formData.append('event_date', eventDate);
            formData.append('event_time', eventTime);
            if (selectedLocation) {
                formData.append('location_lat', selectedLocation.lat);
                formData.append('location_lng', selectedLocation.lng);
            }
            formData.append('participants_email', JSON.stringify([userEmail]));
            formData.append('created_by', userEmail);
            // Submit event/invite
            $.ajax({
                url: 'phpFile/globalSide/createEvent.php',
                method: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                success: function(res) {
                    if (res && res.status === 'success') {
                        location.reload();
                    } else {
                        alert(res && res.message ? res.message : 'Failed to create invite.');
                    }
                },
                error: function() {
                    alert('Failed to create invite.');
                }
            });
        });
    });

    // --- GOOGLE MAP LOCATION MODAL LOGIC ---
    let locationMap, locationMarker, selectedLocation = null;

    function initLocationMap() {
        const defaultLatLng = { lat: 14.4134, lng: 120.9370 };
        const mapDiv = document.getElementById('googleMapContainer');
        if (!mapDiv) return;
        // If map already initialized, just resize and return
        if (locationMap) {
            google.maps.event.trigger(locationMap, 'resize');
            if (selectedLocation) {
                locationMap.setCenter(selectedLocation);
                if (locationMarker) locationMarker.setPosition(selectedLocation);
            }
            return;
        }
        locationMap = new google.maps.Map(mapDiv, {
            center: selectedLocation || defaultLatLng,
            zoom: 13,
        });
        locationMarker = new google.maps.Marker({
            position: selectedLocation || defaultLatLng,
            map: locationMap,
            draggable: true,
        });
        // Update selectedLocation on marker drag
        locationMarker.addListener('dragend', function () {
            selectedLocation = {
                lat: locationMarker.getPosition().lat(),
                lng: locationMarker.getPosition().lng(),
            };
            // Store on button for preview
            $('#addLocationBtn').data('location', selectedLocation);
        });
        // Set marker on map click
        locationMap.addListener('click', function (e) {
            const pos = e.latLng;
            locationMarker.setPosition(pos);
            selectedLocation = { lat: pos.lat(), lng: pos.lng() };
            // Store on button for preview
            $('#addLocationBtn').data('location', selectedLocation);
        });
    }

    $('#locationModal').on('shown.bs.modal', function () {
        setTimeout(initLocationMap, 300);
    });

    $('#selectLocationBtn').on('click', function () {
        if (!selectedLocation) {
            alert('Please select a location on the map.');
            return;
        }
        console.log('Selected Location:', selectedLocation); // Log to console
        $('#locationModal').modal('hide');
        $('#addLocationBtn').html('<i class="fas fa-map-marker-alt"></i> Location Added').addClass('btn-success').removeClass('btn-outline-primary');
        $('#addLocationBtn').data('location', selectedLocation);
    });

    function getSelectedLocation() {
        // Always get the latest from the button's data
        return $('#addLocationBtn').data('location') || null;
    }

    // --- POST PREVIEW MODAL LOGIC ---
    function showPostPreviewModal(postData) {
        // ...existing code to build modal...
        let locationHtml = '';
        // Use getSelectedLocation() to ensure we get the latest
        const loc = postData.location || getSelectedLocation();
        if (loc && loc.lat && loc.lng) {
            locationHtml = `<div class="mb-2"><strong>Location:</strong> <span class="text-monospace">Lat: ${loc.lat.toFixed(6)}, Lng: ${loc.lng.toFixed(6)}</span></div>`;
        }
        // ...existing code...
        const modalHtml = `
        <div class="modal fade" id="postPreviewModal" tabindex="-1" aria-labelledby="postPreviewModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="postPreviewModalLabel">Preview Post</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Media preview, caption, date/time, etc. -->
                        ${locationHtml}
                        <!-- ...other preview content... -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirmPostBtn">Post</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        // ...existing code to inject and show modal...
    }

    // --- Enhance Send Invite (Post Composer) UI ---
    $('#postComposer').addClass('shadow-lg border-0 rounded-4').css({
        background: '#f8fafc',
        boxShadow: '0 6px 24px rgba(0,0,0,0.08)'
    });
    $('#postComposer h5').addClass('fw-bold text-primary mb-3').prepend('<i class="fas fa-paper-plane me-2"></i>');
    $('#postComposer .form-select').addClass('mb-3 rounded-3 border-0 shadow-sm');
    $('#postComposer textarea').addClass('mb-3 rounded-3 border-0 shadow-sm');
    $('#postComposer input[type="file"]').addClass('mb-3 rounded-3 border-0 shadow-sm');
    $('#addLocationBtn').addClass('mb-3 rounded-3').css('fontWeight', '500');
    $('#postButton').addClass('rounded-3 fw-bold').css('fontSize', '1.1rem');

    // --- FETCH AND RENDER INVITES IN POST LIST (CARD FORMAT) ---
    function fetchAndRenderInvitesCardFormat() {
        $.ajax({
            url: 'phpFile/globalSide/fetchInvites.php',
            method: 'GET',
            dataType: 'json',
            cache: false,
            success: function(res) {
                if (res.status === 'success' && Array.isArray(res.invites) && res.invites.length > 0) {
                    const $postList = $("#personalizedContainer .post-list");
                    $postList.empty();
                    res.invites.forEach(function(invite) {
                        // Fallbacks for missing data
                        const groupImg = invite.group_img ? `media/images/groups/${invite.group_img}` : 'media/images/profiles/group1.jpg';
                        const groupName = invite.group_name || 'Play Park Group';
                        const invitedOn = invite.created_at ? new Date(invite.created_at).toLocaleString() : '2025-01-20 10:00';
                        const eventName = invite.event_title || invite.title || 'Pet Vaccination Drive';
                        const eventDate = invite.event_date || '2025-02-05';
                        const eventTime = invite.event_time || '10:00 AM - 4:00 PM';
                        let location = 'Green Valley Park';
                        if (invite.location_lat && invite.location_lng) {
                            const lat = invite.location_lat;
                            const lng = invite.location_lng;
                            location = `<a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener">Lat: ${lat}, Lng: ${lng}</a>`;
                        } else if (invite.location_name) {
                            location = invite.location_name;
                        }
                        const mediaArr = invite.media ? (() => { try { return JSON.parse(invite.media); } catch(e) { return []; } })() : [];
                        const mediaHtml = mediaArr.length > 0 ? `<img src="media/images/posts/${mediaArr[0]}" alt="${eventName}" class="event-img mb-3">` : '<img src="media/images/posts/vaccineInvite.jpg" alt="Pet Vaccination Drive" class="event-img mb-3">';
                        const description = invite.caption || 'Join us for a day dedicated to pet health and vaccination awareness. Bring your pets and get free consultations from certified vets!';
                        const cardHtml = `
<div class="post-card card p-3 mb-4">
    <div class="post-header d-flex align-items-center mb-3">
        <img src="${groupImg}" alt="Event Creator Profile" class="profile-img me-3">
        <div>
            <div class="fw-bold">${groupName}</div>
            <div class="text-muted">Invited on: ${invitedOn}</div>
        </div>
    </div>
    <div class="post-content mb-3">
        <p class="fw-bold">You're invited to join the <strong>${eventName}</strong>!</p>
        ${mediaHtml}
        <p>Details:</p>
        <ul>
            <li><strong>Event Name:</strong> ${eventName}</li>
            <li><strong>Date:</strong> ${eventDate}</li>
            <li><strong>Time:</strong> ${eventTime}</li>
            <li><strong>Location:</strong> ${location}</li>
        </ul>
        <p>${description}</p>
    </div>
    <div class="post-actions d-flex justify-content-start mt-3">
        <button class="btn btn-light btn-sm me-2 accept-invite-btn" data-invite-id="${invite.id}">
            <i class="fas fa-calendar-check"></i> Accept Invite
        </button>
        <button class="btn btn-light btn-sm me-2 decline-invite-btn" data-invite-id="${invite.id}">
            <i class="fas fa-calendar-times"></i> Decline Invite
        </button>
    </div>
</div>`;
                        $postList.append(cardHtml);
                    });
                } else {
                    $("#personalizedContainer .post-list").html('<div class="text-danger text-center">No invites found.</div>');
                }
            },
            error: function(xhr, status, error) {
                $("#personalizedContainer .post-list").html('<div class="text-danger text-center">Failed to load invites.</div>');
                console.error('fetchInvites.php error:', status, error, xhr.responseText);
            }
        });
    }
    // Call this function on page load or as needed
    $(document).ready(function() {
        fetchAndRenderInvitesCardFormat();
    });

    // Accept/Decline Invite Logic
    $(document).on('click', '.accept-invite-btn', function() {
        const inviteId = $(this).data('invite-id');
        $.post('phpFile/globalSide/handleInviteAction.php', { invite_id: inviteId, action: 'accept' }, function(res) {
            if (res && res.status === 'success') {
                fetchAndRenderInvitesCardFormat();
            } else {
                alert(res && res.message ? res.message : 'Failed to accept invite.');
            }
        }, 'json');
    });

    $(document).on('click', '.decline-invite-btn', function() {
        const inviteId = $(this).data('invite-id');
        $.post('phpFile/globalSide/handleInviteAction.php', { invite_id: inviteId, action: 'decline' }, function(res) {
            if (res && res.status === 'success') {
                fetchAndRenderInvitesCardFormat();
            } else {
                alert(res && res.message ? res.message : 'Failed to decline invite.');
            }
        }, 'json');
    });

    // --- FETCH AND RENDER ACCEPTED INVITES IN LEFT SIDEBAR ---
    // ...existing code...

// Render accepted invites in the left sidebar
// ...existing code...

function fetchAndRenderAcceptedInvites() {
    $.ajax({
        url: 'phpFile/globalSide/fetchAcceptedInvites.php',
        method: 'GET',
        dataType: 'json',
        cache: false,
        success: function(res) {
            const $inviteList = $('#inviteList');
            $inviteList.empty();
            let count = 0;
            if (res.status === 'success' && Array.isArray(res.invites) && res.invites.length > 0) {
                count = res.invites.length;
                res.invites.forEach(function(invite) {
                    // ...existing rendering code...
                    // (no changes needed here)
                    // ...
                    const groupName = invite.group_name || 'Group';
                    const eventTitle = invite.event_title || invite.title || 'Event';
                    const eventDate = invite.event_date || '';
                    const eventTime = invite.event_time || '';
                    const groupImg = invite.group_img ? `media/images/groups/${invite.group_img}` : 'media/images/groups/default_group.png';
                    const lat = invite.location_lat, lng = invite.location_lng;
                    const hasMap = lat && lng;
                    const mapUrl = hasMap ? `https://www.google.com/maps?q=${lat},${lng}` : '#';
                    const contentHtml = `
                        <div class="d-flex align-items-center gap-3 p-3 rounded-4 accepted-invite-item mb-3 shadow-sm invite-card-modern position-relative ripple-link"
                             style="cursor: ${hasMap ? 'pointer' : 'default'};"
                             data-map-url="${hasMap ? mapUrl : ''}"
                             data-invite-id="${invite.id}">
                            <div class="invite-card-border me-2"></div>
                            <img src="${groupImg}" alt="${groupName}" class="group-img flex-shrink-0" style="width:48px;height:48px;object-fit:cover;border-radius:50%;border:2px solid #38b6ff;box-shadow:0 2px 8px rgba(56,182,255,0.10);">
                            <div class="flex-grow-1">
                                <div class="fw-bold text-primary fs-6">${groupName}</div>
                                <div class="small text-dark mb-1"><i class="fa-solid fa-calendar-days me-1 text-warning"></i> ${eventDate} <span class="ms-2"><i class="fa-solid fa-clock me-1 text-info"></i>${eventTime}</span></div>
                                <div class="small text-secondary"><i class="fa-solid fa-star me-1 text-success"></i>${eventTitle}</div>
                            </div>
                            <button class="btn btn-link text-danger btn-sm ms-2 remove-accepted-invite-btn" data-invite-id="${invite.id}" title="Remove from accepted" tabindex="0"><i class="fa-solid fa-xmark fa-lg"></i></button>
                        </div>`;
                    $inviteList.append(contentHtml);
                });
            } else {
                $inviteList.html('<div class="text-muted text-center small">No accepted invites.</div>');
            }
            // Update the badge count dynamically
            $('.badge.bg-danger.rounded-pill.position-absolute.end-0').text(count);
        },
        error: function() {
            $('#inviteList').html('<div class="text-danger text-center small">Failed to load accepted invites.</div>');
            // Set badge to 0 on error
            $('.badge.bg-danger.rounded-pill.position-absolute.end-0').text(0);
        }
    });
}

function fetchAndRenderRejectedInvites() {
    $.ajax({
        url: 'phpFile/globalSide/fetchRejectedInvites.php',
        method: 'GET',
        dataType: 'json',
        cache: false,
        success: function(res) {
            const $rejectedList = $('#rejectedInviteList');
            $rejectedList.empty();
            let count = 0;

            if (res.status === 'success' && Array.isArray(res.invites) && res.invites.length > 0) {
                count = res.invites.length;

                res.invites.forEach(function(invite) {
                    const groupName = invite.group_name || 'Group';
                    const eventTitle = invite.event_title || invite.title || 'Event';
                    const eventDate = invite.event_date || '';
                    const eventTime = invite.event_time || '';
                    const groupImg = invite.group_img ? `media/images/groups/${invite.group_img}` : 'media/images/groups/default_group.png';

                    const lat = invite.location_lat, lng = invite.location_lng;
                    const hasMap = lat && lng;
                    const mapUrl = hasMap ? `https://www.google.com/maps?q=${lat},${lng}` : '#';

                    const contentHtml = `
                        <div class="d-flex align-items-center gap-3 p-3 rounded-4 invite-card-modern mb-3 shadow-sm position-relative rejected-invite-item ripple-link"
                             style="cursor: ${hasMap ? 'pointer' : 'default'};"
                             data-map-url="${hasMap ? mapUrl : ''}"
                             data-invite-id="${invite.id}">
                            <div class="invite-card-border me-2 bg-secondary"></div>
                            <img src="${groupImg}" alt="${groupName}" class="group-img flex-shrink-0" style="width:48px;height:48px;object-fit:cover;border-radius:50%;border:2px solid #adb5bd;box-shadow:0 2px 8px rgba(173,181,189,0.15);">
                            <div class="flex-grow-1">
                                <div class="fw-bold text-muted fs-6">${groupName}</div>
                                <div class="small text-dark mb-1"><i class="fa-solid fa-calendar-days me-1 text-warning"></i> ${eventDate} <span class="ms-2"><i class="fa-solid fa-clock me-1 text-info"></i>${eventTime}</span></div>
                                <div class="small text-secondary"><i class="fa-solid fa-ban me-1 text-danger"></i>${eventTitle}</div>
                            </div>
                             <button class="btn btn-link text-success btn-sm ms-2 restore-invite-btn" data-invite-id="${invite.id}" title="Mark as accepted"><i class="fa-solid fa-check fa-lg"></i></button>
                        </div>`;
                    $rejectedList.append(contentHtml);
                });
            } else {
                $rejectedList.html('<div class="text-muted text-center small">No rejected invites.</div>');
            }

            $('#rejectedInviteCount').text(count);
        },
        error: function() {
            $('#rejectedInviteList').html('<div class="text-danger text-center small">Failed to load rejected invites.</div>');
            $('#rejectedInviteCount').text(0);
        }
    });
}


// ...existing code...

// Card body click: open Google Maps if not clicking the x button
$(document).on('click', '.accepted-invite-item', function(e) {
    // If the click is on the x button or its icon, do nothing here
    if ($(e.target).closest('.remove-accepted-invite-btn').length > 0) return;
    const mapUrl = $(this).data('map-url');
    if (mapUrl) {
        window.open(mapUrl, '_blank');
    }
});

$(document).on('click', '.rejected-invite-item', function(e) {
    // If the click is on a remove or restore button (if you add one), do nothing
    if ($(e.target).closest('.remove-rejected-invite-btn, .restore-invite-btn').length > 0) return;
    
    const mapUrl = $(this).data('map-url');
    if (mapUrl) {
        window.open(mapUrl, '_blank');
    }
});


// Remove (x) button click: move user from participants to rejected
$(document).on('click', '.remove-accepted-invite-btn', function(e) {
    e.stopPropagation(); // Prevent card body click
    const inviteId = $(this).data('invite-id');
    $.post('phpFile/globalSide/removeAcceptedInvite.php', { invite_id: inviteId }, function(res) {
        if (res && res.status === 'success') {
            fetchAndRenderAcceptedInvites();
            fetchAndRenderRejectedInvites();

        } else {
            alert(res && res.message ? res.message : 'Failed to remove invite.');
        }
    }, 'json');
});

$(document).on('click', '.restore-invite-btn', function(e) {
    e.stopPropagation(); // Prevent opening map
    const inviteId = $(this).data('invite-id');

    $.post('phpFile/globalSide/restoreRejectedInvite.php', { invite_id: inviteId }, function(res) {
        if (res && res.status === 'success') {
            fetchAndRenderRejectedInvites();
            fetchAndRenderAcceptedInvites();
        } else {
            alert(res && res.message ? res.message : 'Failed to restore invite.');
        }
    }, 'json');
});


// ...existing code...
    // Call both fetchers on page load
    $(document).ready(function() {
        fetchAndRenderInvitesCardFormat();
        fetchAndRenderAcceptedInvites();
        fetchAndRenderRejectedInvites();
    });

    // Also refresh accepted invites after accepting/declining
    $(document).on('click', '.accept-invite-btn, .decline-invite-btn', function() {
        setTimeout(fetchAndRenderAcceptedInvites, 500);
    });
});

// Add CSS for hover effect (inject if not present)
if (!document.getElementById('accepted-invite-style')) {
    const style = document.createElement('style');
    style.id = 'accepted-invite-style';
    style.innerHTML = `
        .invite-card-hover:hover {
            background: #e6f7ff !important;
            box-shadow: 0 2px 12px rgba(56,182,255,0.15) !important;
            border-color: #38b6ff !important;
            cursor: pointer;
            transition: all 0.2s;
        }
    `;
    document.head.appendChild(style);
}

// Add CSS for modern invite card style and ripple effect (inject if not present)
if (!document.getElementById('accepted-invite-style-modern')) {
    const style = document.createElement('style');
    style.id = 'accepted-invite-style-modern';
    style.innerHTML = `
        .invite-card-modern {
            background: linear-gradient(90deg, #f8fbff 80%, #e6f7ff 100%);
            border-left: 6px solid #38b6ff;
            transition: box-shadow 0.2s, background 0.2s;
            box-shadow: 0 2px 12px rgba(56,182,255,0.08);
        }
        .invite-card-modern:hover {
            background: linear-gradient(90deg, #e6f7ff 80%, #b3e6ff 100%);
            box-shadow: 0 4px 18px rgba(56,182,255,0.18);
            border-left: 8px solid #ffde59;
        }
        .invite-card-border {
            width: 6px;
            height: 48px;
            background: linear-gradient(180deg, #38b6ff 60%, #ffde59 100%);
            border-radius: 8px;
        }
        .ripple-link {
            position: relative;
            overflow: hidden;
        }
        .ripple-link:active::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            width: 120%;
            height: 120%;
            background: rgba(56,182,255,0.15);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(1);
            animation: ripple-anim 0.4s linear;
            pointer-events: none;
        }
        @keyframes ripple-anim {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(0.2); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// Show join group modal with search and suggestions
function showJoinGroupModal() {
    // Remove existing modal if present
    $('#joinGroupModal').remove();
    // Modal HTML
    const modalHtml = `
    <div class="modal fade" id="joinGroupModal" tabindex="-1" aria-labelledby="joinGroupModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="joinGroupModalLabel">Join a Group</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <input type="text" class="form-control" id="groupSearchInput" placeholder="Search for groups...">
            </div>
            <div id="groupSuggestions" class="mb-4">
              <div class="fw-bold mb-2">Group Suggestions</div>
              <div id="suggestedGroupsList" class="row g-2"></div>
            </div>
            <div id="searchResults">
              <div class="fw-bold mb-2">Search Results</div>
              <div id="searchGroupsList" class="row g-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    $('body').append(modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('joinGroupModal'));
    modal.show();

    // Fetch and render group suggestions
    $.get('phpFile/globalSide/fetchGroupSuggestions.php', function(res) {
        if (res && res.status === 'success' && Array.isArray(res.groups)) {
            renderGroupList(res.groups, '#suggestedGroupsList');
        } else {
            $('#suggestedGroupsList').html('<div class="text-muted small">No suggestions available.</div>');
        }
    }, 'json');

    // Search handler
    $('#groupSearchInput').on('input', function() {
        const query = $(this).val().trim();
        if (!query) {
            $('#searchGroupsList').empty();
            return;
        }
        $.get('phpFile/globalSide/searchGroups.php', { q: query }, function(res) {
            if (res && res.status === 'success' && Array.isArray(res.groups)) {
                renderGroupList(res.groups, '#searchGroupsList');
            } else {
                $('#searchGroupsList').html('<div class="text-muted small">No groups found.</div>');
            }
        }, 'json');
    });
}

// Render group cards in a container
function renderGroupList(groups, containerSelector) {
    const $container = $(containerSelector);
    $container.empty();
    if (!groups.length) {
        $container.html('<div class="text-muted small">No groups found.</div>');
        return;
    }
    groups.forEach(group => {
        const img = group.group_img ? `media/images/groups/${group.group_img}` : 'media/images/groups/default_group.png';
        const html = `
        <div class="col-md-6">
          <div class="card shadow-sm mb-2 group-suggestion-card" data-group-id="${group.group_id}">
            <div class="d-flex align-items-center gap-3 p-2">
              <img src="${img}" alt="${group.group_name}" class="group-img flex-shrink-0" style="width:48px;height:48px;object-fit:cover;border-radius:50%;">
              <div class="flex-grow-1">
                <div class="fw-bold">${group.group_name}</div>
                <div class="small text-muted">${group.group_description || ''}</div>
              </div>
              <button class="btn btn-primary btn-sm join-this-group-btn" data-group-id="${group.group_id}">Join</button>
            </div>
          </div>
        </div>`;
        $container.append(html);
    });
}

// Attach join group modal to button
$(document).on('click', '#joinGroupBtn', function() {
    showJoinGroupModal();
});

// Join group button inside modal
$(document).on('click', '.join-this-group-btn', function() {
    const groupId = $(this).data('group-id');
    $.post('phpFile/globalSide/joinGroup.php', { group_id: groupId }, function(res) {
        if (res && res.status === 'success') {
            alert('Joined group successfully!');
            location.reload();
        } else {
            alert(res && res.message ? res.message : 'Failed to join group.');
        }
    }, 'json');
});