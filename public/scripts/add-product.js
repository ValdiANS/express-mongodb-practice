import { faker } from 'https://esm.sh/@faker-js/faker/locale/en';

const titleInputField = document.getElementById('title');
const imageUrlInputField = document.getElementById('imageUrl');
const priceInputField = document.getElementById('price');
const descriptionInputField = document.getElementById('description');
const userIdSelectField = document.getElementById('userId');

const autofillBtn = document.getElementById('autofill');

autofillBtn.addEventListener('click', () => {
  const title = faker.commerce.productName();
  const imageUrl = faker.image.urlPlaceholder({
    width: 512,
    height: 512,
    backgroundColor: 'B4E0F8',
    textColor: 'FFFFFF',
    format: 'png',
    text: title,
  });
  const price = faker.commerce.price({ max: 200, dec: 2 });
  const description = `${faker.commerce.productDescription()}.\n\n${faker.lorem.paragraphs(
    { min: 2, max: 4 },
    '\n\n'
  )}`;

  const userIdSelectedIndex = getRandomInt(userIdSelectField.length);

  autofillForm({
    title,
    imageUrl,
    price,
    description,
    userIdSelectedIndex,
  });
});

function autofillForm({
  title = '',
  imageUrl = '',
  price = '',
  description = '',
  userIdSelectedIndex = 0,
}) {
  titleInputField.value = title;
  imageUrlInputField.value = imageUrl;
  priceInputField.value = price;
  descriptionInputField.value = description;
  userIdSelectField.selectedIndex = userIdSelectedIndex;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
