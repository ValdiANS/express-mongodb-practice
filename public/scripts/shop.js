const changeUserForm = document.getElementById('changeUserForm');
const userIdSelect = document.getElementById('userId');

userIdSelect.addEventListener('change', (event) => {
  changeUserForm.submit();
});
