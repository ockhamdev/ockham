You are implementing a feature for a web application.

## Feature: Click-to-Edit Modal for Test Items

### Context
There is a Tests section in the application that displays a list or table of test items. Each test item has associated data (e.g., name, description, configuration, status).

### Requirement
When a user clicks on any test item (row, card, or name link) in the Tests list, an **edit modal dialog** must open.

### Modal Behavior
1. **Trigger:** User clicks on a test item in the Tests list/table.
2. **Open:** A modal/dialog appears overlaying the current page (do not navigate away).
3. **Pre-fill:** The modal is pre-populated with the selected test's current field values.
4. **Editable Fields:** Include all relevant fields for a test (e.g., test name, description, configuration options — adjust based on the data model).
5. **Actions:**
   - **Save button:** Validates input, submits updated data to the backend via API (e.g., `PUT /api/tests/:id`), closes the modal on success, and refreshes/updates the test item in the list.
   - **Cancel / Close button (X):** Closes the modal without saving any changes.
6. **Error Handling:** If the save request fails, display an inline error message inside the modal without closing it.
7. **Loading State:** Show a loading indicator on the Save button while the request is in progress.
8. **Permissions:** Only users with edit permissions should be able to trigger the modal; others should see a read-only view or have the click action disabled.

### Technical Notes
- Use a reusable Modal component so the same component can be used for creating and editing tests.
- The modal should be accessible (focus trap, ESC key to close, ARIA attributes).
- Ensure the Tests list reflects updated data after a successful save (optimistic update or re-fetch).

### Acceptance Criteria
- [ ] Clicking a test item opens the edit modal.
- [ ] Modal is pre-filled with the correct test data.
- [ ] Saving updates the test and reflects changes in the list.
- [ ] Cancelling or pressing ESC closes the modal with no changes.
- [ ] Error messages are shown inside the modal on failure.
- [ ] Modal is fully accessible.