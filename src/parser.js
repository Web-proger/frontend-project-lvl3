export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');

  const title = doc.querySelector('channel title').textContent;
  const description = doc.querySelector('channel description').textContent;

  const postsData = doc.querySelectorAll('channel item');
  const posts = Array.from(postsData).map((el) => ({
    title: el.querySelector('title').textContent,
    link: el.querySelector('link').textContent,
  }));

  return { title, description, posts };
};