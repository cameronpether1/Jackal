import Blogcard from "@/components/Blogcard/blogcard";
import Blogcardvertical from "@/components/Blogcardvertical/blogcardvertical";
import Link from "next/link";

const Blog = () => {
  return (
    <div className="mt-[180px]">
      <Link href="/blog/post">
        <Blogcard />
      </Link>
      <div className="flex justify-center items-center ">
        <div className="mx-[380px] my-[50px] flex flex-col md:flex-row justify-between items-center  ">
          <Link href="/blog/post">
            <Blogcardvertical />
          </Link>
          <Link href="/blog/post">
            <Blogcardvertical />
          </Link>
          <Link href="/blog/post">
            <Blogcardvertical />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog;
