import Blogcard from "@/components/Blogcard/blogcard";
import Blogcardvertical from "@/components/Blogcardvertical/blogcardvertical";
import Link from "next/link";
import { getPosts } from "../api/postss";

// const getData = async () => {
//   const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
//     next: { revalidate: 3600 },
//   });

//   if (!res.ok) {
//     throw new Error("Something went wrong");
//   }

//   return res.json();
// };

const Blog = async () => {
  // FETCH DATA WITH AN API
  // const posts = await getData();

  // FETCH DATA WITHOUT AN API
  const posts = await getPosts();

  return (
    <div className="mt-[180px]">
      <Blogcard />
      <div className="flex justify-center items-center ">
        <div className="w-[900px] my-[50px] flex flex-col md:flex-row justify-between items-center flex-wrap md:justify-start ">
          {posts.map((post) => (
            <Link href={`/blog/${post.id}`}>
              <Blogcardvertical key={post.id} post={post}></Blogcardvertical>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
