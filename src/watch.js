import onChange from 'on-change';
import i18next from 'i18next';

const getHtml = (data, type) => {
  switch (type) {
    case 'feeds':
      return data
        .map(({ title, description }) => (`<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`))
        .join('');
    case 'posts':
      return data
        .map(({
          link,
          title,
          postId,
          isViewed,
        }) => (`
            <li class="list-group-item ${isViewed ? 'font-weight-normal' : 'font-weight-bold'}">
                <button id="${postId}" type="button" class="btn btn-primary mr-3" data-toggle="modal" data-target="#modal">View</button>
                <a href="${link}">${title}</a>
            </li>
        `))
        .join('');
    default:
      throw new Error(i18next.t('message.successMessage'));
  }
};

const initInterface = () => {
  document.querySelector('#title').innerHTML = i18next.t('title');
  document.querySelector('#description').innerHTML = i18next.t('description');
  document.querySelector('#example').innerHTML = i18next.t('example');
  document.querySelector('#submit-button').innerHTML = i18next.t('buttonText');
  document.querySelector('#footer-text').innerHTML = i18next.t('footerText');
  document.querySelector('#footer-link-text').innerHTML = i18next.t('footerLinkText');
};

export default (state, elementObject) => {
  const element = elementObject;

  const regExp = RegExp(/^posts.\d+.isViewed$/);

  return onChange(state, (path, value, previousValue) => {
    if (value === previousValue || regExp.test(path)) return;

    switch (path) {
      case 'form.status':
        if (value === 'sending') {
          element.button.setAttribute('disabled', '');
        }
        if (value === 'input') {
          element.button.removeAttribute('disabled');
          element.inputField.value = '';
        }
        if (value === 'error') {
          element.button.removeAttribute('disabled');
        }
        break;
      case 'form.feedback':
        element.feedback.textContent = value;
        if (value === '') {
          element.feedback.classList.remove('text-success', 'text-danger');
          return;
        }
        if (value === i18next.t('message.successMessage')) {
          element.feedback.classList.add('text-success');
          return;
        }
        element.feedback.classList.add('text-danger');
        break;
      // Валидность формы
      case 'form.valid':
        if (value) {
          element.inputField.classList.remove('is-invalid');
          return;
        }
        element.inputField.classList.add('is-invalid');
        break;
      case 'uiState.language':
        if (previousValue) {
          document.querySelector(`[data-language=${previousValue}]`).classList.remove('active');
        }
        document.querySelector(`[data-language=${value}]`).classList.add('active');
        i18next.changeLanguage(value).then(initInterface);
        break;
      case 'uiState.modal':
        element.modalLink.innerHTML = value.title;
        element.modalLink.href = value.link;
        element.modalDescription.innerHTML = value.description;
        break;
      // Формирую блок фидов
      case 'feeds':
        element.feeds.innerHTML = `<h2>Feeds</h2><ul class="list-group mb-5">${getHtml(value, 'feeds')}</ul>`;
        break;
      // Формирую блок постов
      case 'posts':
        element.posts.innerHTML = `<h2>Posts</h2><ul class="list-group">${getHtml(value, 'posts')}</ul>`;
        break;
      default:
        throw new Error('Unknown path');
    }
  });
};
