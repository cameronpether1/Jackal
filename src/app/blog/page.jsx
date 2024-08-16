// import Blogcard from "@/components/Blogcard/blogcard";
// import Blogcardvertical from "@/components/Blogcardvertical/blogcardvertical";
// import Link from "next/link";
// import { getPosts } from "../api/postss";

// const Blog = async () => {
//   const posts = await getPosts();

//   return (
//     <div className="mt-[180px]">
//       <Blogcard />
//       <div className="flex justify-center items-center ">
//         <div className="w-[900px] my-[50px] flex flex-col md:flex-row justify-between items-center flex-wrap md:justify-start ">
//           {posts.map((post) => (
//             <Link href={`/blog/${post.id}`} key={post.id}>
//               <Blogcardvertical post={post} />
//             </Link>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Blog;
