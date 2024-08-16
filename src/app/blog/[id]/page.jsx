// import { getPost } from "@/app/api/postss";

// const SinglePostPage = async ({ params }) => {
//   const { id } = params;

//   // FETCH DATA WITHOUT AN API
//   const post = await getPost(id);

//   return (
//     <div className="flex flex-col justify-center items-center ">
//       <div className="w-[70vw]">
//         <div className="flex justify-center items-end min-h-[200px] h-[600px] bg-white/10 backdrop-blur-[2px] border overflow-hidden">
//           <img
//             src={`/img/${post.img}.png`}
//             alt="blog image"
//             className=" h-full hover:blur-[2px]"
//           />
//         </div>
//         <p className="text-[18px] pb-[10px] ">{post.title}</p>
//         <p className="text-[14px] leading-loose">{post.body}</p>
//       </div>
//     </div>
//   );
// };

// export default SinglePostPage;
