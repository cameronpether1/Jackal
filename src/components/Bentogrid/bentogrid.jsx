const Bento = () => {
  return (
    <div className=" h-screen w-screen flex flex-col md:flex-row justify-evenly align-center p-[20px]">
      <div className=" min-w-[375px] min-h-[300px] bg-[radial-gradient(100%_100%_at_50%_50%,rgba(110,103,235,0.40)_0%,rgba(255,255,255,0.00)_80%)] w-[30vw] h-[25vw] aspect-square box-border m-[5px] rounded-[50px] border border-[#FFFFFF29] ">
        <div className="p-[50px]">
          <h2 className="text-[20px]">List and board</h2>
          <p className="pt-[20px] text-[12px] w-[300px]">
            Switch between list and board layout to view work from any angle.
          </p>
        </div>
      </div>
      <div className="min-w-[375px] min-h-[300px] bg-[radial-gradient(100%_100%_at_50%_50%,rgba(110,103,235,0.40)_0%,rgba(255,255,255,0.00)_80%)] w-[30vw] h-[25vw] aspect-square box-border m-[5px] rounded-[50px] border border-[#FFFFFF29] ">
        <div className="p-[50px]">
          <h2 className="text-[20px]">Make it yours</h2>
          <p className="pt-[20px] text-[12px] w-[300px]">
            Quickly apply filters and operators to refine your issue lists and
            create custom views.
          </p>
        </div>
      </div>
    </div>
  );
};
export default Bento;
