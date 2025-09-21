<div class="tags-container">
  <div class="d-flex flex-wrap gap-1 position-relative">
    <input id="tags-trigger" class="form-control" type="text" placeholder="[[tags:enter-tags-here]]" tabindex="4" readonly/>
    <input type="hidden" class="tags-input" name="tags" value="" />
  </div>
</div>

<!-- Tag Selection Pop-up -->
<div id="tags-popup-overlay" class="tags-popup-overlay hidden">
  <div class="tags-popup">
    <div class="tags-popup-header">
      <h4>[[tags:select-tags]]</h4>
      <button type="button" class="btn btn-sm btn-light close-tags-popup">
        <i class="fa fa-times"></i>
      </button>
    </div>
    <div class="tags-popup-body">
      <div class="tag-search-container">
        <input class="tags-search form-control" type="text" placeholder="[[tags:search-tags]]"/>
      </div>
      
      <div class="tags-suggestion-container">
        <!-- Tag suggestions will be populated here -->
      </div>
      
      <div class="selected-tags-container mt-3">
        <h5>[[tags:selected-tags]]:</h5>
        <div class="selected-tags d-flex flex-wrap gap-1">
          <!-- Selected tags will be populated here -->
        </div>
      </div>
    </div>
    <div class="tags-popup-footer">
      <button type="button" class="btn btn-primary apply-tags">[[global:apply]]</button>
    </div>
  </div>
</div>