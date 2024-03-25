import { faker } from 'https://esm.sh/@faker-js/faker/locale/en';

const nameInputField = document.getElementById('name');
const emailInputField = document.getElementById('email');

const autofillBtn = document.getElementById('autofill');

autofillBtn.addEventListener('click', () => {
  const name = faker.person.fullName();

  const nameArr = name
    .replace('Mr. ', '')
    .replace('Mrs. ', '')
    .replace('Miss ', '')
    .replace('Ms. ', '')
    .replace('Dr. ', '')
    .split(' ');

  const email = faker.internet.email({
    firstName: nameArr[0],
    lastName: nameArr[1],
  });

  autofillForm({
    name,
    email,
  });
});

function autofillForm({ name = '', email = '' }) {
  nameInputField.value = name;
  emailInputField.value = email;
}
