const filterForm = document.getElementById('filterForm');
const userIdSelect = document.getElementById('userId');

userIdSelect.addEventListener('change', (event) => {
  filterForm.submit();
});
