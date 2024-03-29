const users = [
  {
    id: 1,
    name: "john",
  },
  {
    id: 2,
    name: "sam",
  },
];

const posts = [
  {
    username: "Cameron",
    img: "3",
    id: "1",
    title: "This is Paris",
    body: "this is the body text of the blog about paris ",
  },
  {
    username: "Evelina",
    img: "4",
    id: "2",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
];

export const getPosts = async () => {
  return posts;
};

export const getPost = async (id) => {
  return posts.find((post) => post.id === id);
};
