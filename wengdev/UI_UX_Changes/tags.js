'use strict';

define('composer/tags', ['api', 'alerts', 'translator'], function (api, alerts, translator) {
    const Tags = {};
    let allTags = [];
    
    // Store selected tags per composer instance by uuid
    const composerTags = {};
    
    // Initialize properties for validation
    Tags.minTagsCount = 0;
    Tags.maxTagsCount = 0;

   Tags.init = function (postContainer) {
		const uuid = postContainer.attr('data-uuid');
		if (!uuid) {
			return;
		}
		
		// Initialize the tags array for this composer instance
		composerTags[uuid] = [];
		
		// Initialize with existing tags if available in postData
		if (postContainer.data('postData') && postContainer.data('postData').tags) {
			const existingTags = postContainer.data('postData').tags;
			composerTags[uuid] = Array.isArray(existingTags) ? existingTags : [];
			
			// Update the tags input and trigger
			const hiddenInput = postContainer.find('input.tags-input');
			const tagsTrigger = postContainer.find('#tags-trigger');
			
			hiddenInput.val(composerTags[uuid].join(','));
			tagsTrigger.val(composerTags[uuid].length ? composerTags[uuid].join(', ') : '');
		}
		
		// Set up the tags popup
		setupTagsPopup(postContainer, uuid);
		
		// Get configuration from ajaxify.data or global config
		let minTags = ajaxify.data.hasOwnProperty('minTags') ? ajaxify.data.minTags : config.minimumTagsPerTopic;
		let maxTags = ajaxify.data.hasOwnProperty('maxTags') ? ajaxify.data.maxTags : config.maximumTagsPerTopic;
		
		// Store these values for later use in validation
		Tags.minTagsCount = minTags;
		Tags.maxTagsCount = maxTags;
		
		// Handle category changes if needed
		$(window).on('action:composer.changeCategory', function(ev, data) {
			if (data.uuid !== uuid) {
				return;
			}
			
			// Update min/max tag requirements based on category
			if (data.categoryData) {
				minTags = data.categoryData.hasOwnProperty('minTags') ? data.categoryData.minTags : config.minimumTagsPerTopic;
				maxTags = data.categoryData.hasOwnProperty('maxTags') ? data.categoryData.maxTags : config.maximumTagsPerTopic;
				Tags.minTagsCount = minTags;
				Tags.maxTagsCount = maxTags;
			}
		});

		// Listen for when a post is loaded into the composer
		$(window).on('action:composer.loaded', function(e, data) {
			// Check if we have postData with tags
			if (data.postData && data.postData.tags && data.postData.tags.length) {
				const postContainer = $('[component="composer"][data-uuid="' + data.post_uuid + '"]');
				if (postContainer.length) {
					composerTags[data.post_uuid] = data.postData.tags.slice();
					
					const hiddenInput = postContainer.find('input.tags-input');
					const tagsTrigger = postContainer.find('#tags-trigger');
					
					hiddenInput.val(composerTags[data.post_uuid].join(','));
					tagsTrigger.val(composerTags[data.post_uuid].length ? composerTags[data.post_uuid].join(', ') : '');
				}
			}
		});
		
		// Clean up when composer is discarded/closed
		$(window).on('action:composer.discard', function(ev, data) {
			if (data.uuid === uuid) {
				delete composerTags[uuid];
			}
		});
	};

    function addNewTag(tag, selectedTagsContainer, suggestionContainer, uuid) {
        // Clean up tag (similar to the original's utils.cleanUpTag)
        tag = tag.trim().toLowerCase();
        
        // Validate tag
        if (tag.length < config.minimumTagLength) {
            return alerts.error('[[error:tag-too-short, ' + config.minimumTagLength + ']]');
        } 
        
        if (tag.length > config.maximumTagLength) {
            return alerts.error('[[error:tag-too-long, ' + config.maximumTagLength + ']]');
        }
        
        // Check if max tags limit is reached
        if (Tags.maxTagsCount && composerTags[uuid].length >= Tags.maxTagsCount) {
            return alerts.error('[[error:too-many-tags, ' + Tags.maxTagsCount + ']]');
        }
        
        // Check if tag already exists
        if (composerTags[uuid].includes(tag)) {
            return;
        }
        
        // Add tag to selected tags
        composerTags[uuid].push(tag);
        renderSelectedTags(selectedTagsContainer, uuid);
        
        // Update suggestions
        if (suggestionContainer) {
            const searchTerm = $('.tags-search').val().toLowerCase();
            if (searchTerm) {
                filterTags(suggestionContainer, searchTerm, uuid);
            } else {
                renderTagSuggestions(suggestionContainer, uuid);
            }
        }
    }
    
    function setupTagsPopup(postContainer, uuid) {
		const tagsTrigger = postContainer.find('#tags-trigger');
		const tagsPopupOverlay = $('#tags-popup-overlay');
		const closeTagsPopup = tagsPopupOverlay.find('.close-tags-popup');
		const tagsSearch = tagsPopupOverlay.find('.tags-search');
		const tagsSuggestionContainer = tagsPopupOverlay.find('.tags-suggestion-container');
		const selectedTagsContainer = tagsPopupOverlay.find('.selected-tags');
		const applyTagsButton = tagsPopupOverlay.find('.apply-tags');
		const hiddenInput = postContainer.find('input.tags-input');
		
		// Set the placeholder with min/max tag length values
		translator.translate('[[tags:enter-tags-here, ' + config.minimumTagLength + ', ' + config.maximumTagLength + ']]', function(translated) {
			tagsTrigger.attr('placeholder', translated);
		});

		// Open the tags popup
		tagsTrigger.on('click', function() {
			// Use the existing composerTags for this uuid, but if the input has values that differ, use those
			const currentInputTags = hiddenInput.val();
			if (currentInputTags) {
				const inputTagsArray = currentInputTags.split(',');
				// Only update if there's an actual difference
				if (inputTagsArray.length > 0 && inputTagsArray[0] !== '') {
					if (!composerTags[uuid] || 
						inputTagsArray.length !== composerTags[uuid].length || 
						inputTagsArray.some(tag => !composerTags[uuid].includes(tag))) {
						composerTags[uuid] = inputTagsArray;
					}
				}
			}
			
			// Store current uuid in data attribute to identify the current composer
			tagsPopupOverlay.data('composer-uuid', uuid);
			
			// Render selected tags
			renderSelectedTags(selectedTagsContainer, uuid);
			
			// Fetch available tags
			fetchTags(tagsSuggestionContainer, uuid);
			
			// Show the popup
			tagsPopupOverlay.removeClass('hidden');
		});
        
        // Close the popup
        closeTagsPopup.on('click', function() {
            tagsPopupOverlay.addClass('hidden');
        });
        
        // Close popup when clicking outside
        tagsPopupOverlay.on('click', function(e) {
            if (e.target === tagsPopupOverlay[0]) {
                tagsPopupOverlay.addClass('hidden');
            }
        });
        
        // Search tags
        tagsSearch.on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            // Get the current composer uuid
            const currentUuid = tagsPopupOverlay.data('composer-uuid');
            filterTags(tagsSuggestionContainer, searchTerm, currentUuid);
        });

        // Add new tag from search input
        tagsSearch.on('keydown', function(e) {
            if (e.keyCode === 13 && $(this).val().trim()) { // Enter key
                const tag = $(this).val().trim();
                // Get the current composer uuid
                const currentUuid = tagsPopupOverlay.data('composer-uuid');
                addNewTag(tag, selectedTagsContainer, tagsSuggestionContainer, currentUuid);
                $(this).val('');
                e.preventDefault();
            }
        });
        
        // Apply selected tags
        applyTagsButton.on('click', function() {
            const currentUuid = tagsPopupOverlay.data('composer-uuid');
            // Find the correct composer container
            const composerContainer = $('[component="composer"][data-uuid="' + currentUuid + '"]');
            const hiddenInput = composerContainer.find('input.tags-input');
            const tagsTrigger = composerContainer.find('#tags-trigger');
            
            hiddenInput.val(composerTags[currentUuid].join(','));
            tagsTrigger.val(composerTags[currentUuid].length ? composerTags[currentUuid].join(', ') : '');
            tagsPopupOverlay.addClass('hidden');
        });
    }
    
    function fetchTags(container, uuid) {
        // Clear previous suggestions
        container.empty();
        
        // Show loading indicator
        container.html('<p class="text-center"><i class="fa fa-spinner fa-spin"></i> Loading tags...</p>');
        
        // Call the API to get all available tags
        api.get('/api/tags', { sort: 'count', limit: 100 }).then((response) => {
            if (response && response.tags && response.tags.length) {
                // Store all tags for filtering later
                allTags = response.tags.map(tag => tag.value);
                
                // Render the tags
                renderTagSuggestions(container, uuid);
            } else {
                container.html('<p class="text-center">[[tags:no-tags-found]]</p>');
            }
        }).catch((err) => {
            container.html('<p class="text-center text-danger">Error loading tags: ' + err.message + '</p>');
        });
    }
    
    function renderTagSuggestions(container, uuid) {
        // Clear container
        container.empty();
        
        if (!allTags.length) {
            container.html('<p class="text-center">[[tags:no-tags-found]]</p>');
            return;
        }
        
        // Filter out tags that are already selected
        const filteredTags = allTags.filter(tag => !composerTags[uuid] || !composerTags[uuid].includes(tag));
        
        if (!filteredTags.length) {
            container.html('<p class="text-center">No more tags available</p>');
            return;
        }
        
        // Create HTML for tag suggestions
        const html = filteredTags.map((tag) => {
            return `<span class="tag-suggestion" data-tag="${tag}">${tag}</span>`;
        }).join('');
        
        container.html(html);
        
        // Add click event to tag suggestions
        container.find('.tag-suggestion').on('click', function() {
            const tag = $(this).data('tag');
            const selectedTagsContainer = $('.selected-tags');
            // Get the current composer uuid
            const currentUuid = $('#tags-popup-overlay').data('composer-uuid');
            addNewTag(tag, selectedTagsContainer, container, currentUuid);
        });
    }
    
    function filterTags(container, searchTerm, uuid) {
        // If we haven't loaded tags yet or search term is empty
        if (!allTags.length) {
            return;
        }
        
        // Filter tags based on search term
        const filteredTags = searchTerm ? 
            allTags.filter(tag => 
                tag.toLowerCase().includes(searchTerm.toLowerCase()) && 
                (!composerTags[uuid] || !composerTags[uuid].includes(tag))
            ) : 
            allTags.filter(tag => !composerTags[uuid] || !composerTags[uuid].includes(tag));
        
        // Clear container
        container.empty();
        
        if (!filteredTags.length) {
            container.html(`<p class="text-center">No matching tags found${searchTerm ? ' for "' + searchTerm + '"' : ''} - Click \`Enter\` to add a new tag</p>`);
            return;
        }
        
        // Create HTML for filtered tag suggestions
        const html = filteredTags.map((tag) => {
            return `<span class="tag-suggestion" data-tag="${tag}">${tag}</span>`;
        }).join('');
        
        container.html(html);
        
        // Add click event to tag suggestions
        container.find('.tag-suggestion').on('click', function() {
            const tag = $(this).data('tag');
            const selectedTagsContainer = $('.selected-tags');
            // Get the current composer uuid
            const currentUuid = $('#tags-popup-overlay').data('composer-uuid');
            addNewTag(tag, selectedTagsContainer, container, currentUuid);
            $('.tags-search').val('').focus();
        });
    }
    
    function renderSelectedTags(container, uuid) {
        // Clear container
        container.empty();
        
        if (!composerTags[uuid] || !composerTags[uuid].length) {
            container.html('<p class="text-muted">No tags selected yet</p>');
            return;
        }
        
        // Create HTML for selected tags
        const html = composerTags[uuid].map((tag) => {
            return `<span class="selected-tag badge bg-primary">${tag} <i class="fa fa-times remove-tag" data-tag="${tag}"></i></span>`;
        }).join('');
        
        container.html(html);
        
        // Add click event to remove tags
        container.find('.remove-tag').on('click', function() {
            const tag = $(this).data('tag');
            const index = composerTags[uuid].indexOf(tag);
            if (index !== -1) {
                composerTags[uuid].splice(index, 1);
                renderSelectedTags(container, uuid);
                
                // Re-filter tag suggestions if search field has text
                const searchTerm = $('.tags-search').val();
                const suggestionContainer = $('.tags-suggestion-container');
                if (searchTerm) {
                    filterTags(suggestionContainer, searchTerm, uuid);
                } else {
                    renderTagSuggestions(suggestionContainer, uuid);
                }
            }
        });
    }
    
    // Utility function to get selected tags
    Tags.getTags = function(post_uuid) {
        return composerTags[post_uuid] || [];
    };
    
    // Implement any other required methods from the original Tags module
    Tags.isEnoughTags = function(post_uuid) {
        return (composerTags[post_uuid] || []).length >= Tags.minTagsCount;
    };

    Tags.minTagCount = function() {
        return Tags.minTagsCount || 0;
    };
    
    return Tags;
});