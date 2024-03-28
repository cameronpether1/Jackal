import Link from "next/link";
const Links = () => {
  const links = [
    {
      title: "Home",
      path: "/",
    },
    {
      title: "About",
      path: "/about",
    },
    {
      title: "Contact",
      path: "/contact",
    },
    {
      title: "Blog",
      path: "/blog",
    },
    {
      title: "Store",
      path: "/store",
    },
  ];

  return (
    <div className="flex items-center justify-end">
      {links.map((link) => (
        <Link
          className="text-[12px] p-[10px]"
          href={link.path}
          key={link.title}
        >
          {link.title}
        </Link>
      ))}
    </div>
  );
};
export default Links;
