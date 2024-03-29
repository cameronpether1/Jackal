"use client";
import { useState } from "react";

function addBlogPost({ addPost }) {
  const [formData, setFormData] = useState({
    username: "",
    img: "",
    title: "",
    body: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addPost(formData);
    setFormData({
      username: "",
      img: "",
      title: "",
      body: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-[400px] h-[200px] bg-black">
      <label>
        Username:
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Image URL:
        <input
          type="text"
          name="img"
          value={formData.img}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Title:
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Body:
        <textarea
          name="body"
          value={formData.body}
          onChange={handleChange}
        ></textarea>
      </label>
      <br />
      <button type="submit">Add Post</button>
    </form>
  );
}

export default addBlogPost;
