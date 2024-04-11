const users = [
  {
    id: 1,
    name: "Cameron",
    password: "12345",
    admin: "true",
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
    img: "3",
    id: "2",
    title: "Hey im cameron",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "4",
    id: "3",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "5",
    id: "4",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "6",
    id: "5",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "7",
    id: "6",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "7",
    id: "7",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "7",
    id: "8",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "5",
    id: "9",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "3",
    id: "10",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "7",
    id: "11",
    title: "Hey im Evelina",
    body: "this is the body text of the blog ",
  },
  {
    username: "Evelina",
    img: "4",
    id: "12",
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
