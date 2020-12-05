import i18next from 'i18next';

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');

  const hasError = doc.querySelector('parsererror');
  if (hasError) {
    throw new Error(i18next.t('message.noValidRss'));
  }

  const title = doc.querySelector('channel title').textContent;
  const description = doc.querySelector('channel description').textContent;

  const elements = doc.querySelectorAll('channel item');
  const posts = Array.from(elements).map((el) => ({
    title: el.querySelector('title').textContent,
    description: el.querySelector('description').textContent,
    link: el.querySelector('link').textContent,
  }));

  return { title, description, posts };
};
