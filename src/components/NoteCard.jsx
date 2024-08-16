"use client";
import React from "react";
import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";
import { setNewOffset, autoGrow, setZIndex, bodyParser } from "@/lib/utilitys";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { updateNote } from "@/lib/supabase/queries";

const NoteCard = ({ note }) => {
  const body = bodyParser(note.body);
  const [position, setPosition] = useState(bodyParser(note.position));
  // const colors = bodyParser(note.colors);

  let mouseStartPos = { x: 0, y: 0 };
  const cardRef = useRef(null);

  const textAreaRef = useRef(null);

  useEffect(() => {
    autoGrow(textAreaRef);
  }, []);

  const mouseDown = (e) => {
    if (e.target.id === "card-header") {
      mouseStartPos.x = e.clientX;
      mouseStartPos.y = e.clientY;

      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);

      setZIndex(cardRef.current);
    }
  };

  const mouseMove = (e) => {
    const mouseMoveDir = {
      x: mouseStartPos.x - e.clientX,
      y: mouseStartPos.y - e.clientY,
    };

    mouseStartPos.x = e.clientX;
    mouseStartPos.y = e.clientY;

    const newPosition = setNewOffset(cardRef.current, mouseMoveDir);
    setPosition(newPosition);
  };

  const mouseUp = async () => {
    document.removeEventListener("mousemove", mouseMove);
    document.removeEventListener("mouseup", mouseUp);

    const newPosition = setNewOffset(cardRef.current);
    console.log(cardRef.current);
    saveData(newPosition);
  };

  const saveData = (newPosition) => {
    // const payload = { [key]: newPosition };
    try {
      updateNote(newPosition);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      ref={cardRef}
      className="card w-[400px] rounded-[20px] border cursor-pointer shadow-[24px_27px_41px_rgba(0,0,0,0.25)] absolute bg-[#F4F4F4]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        onMouseDown={mouseDown}
        id="card-header"
        className="bg-[#F4F4F4] border-b rounded-[5px] flex justify-between items-center p-[5px]"
      >
        <X className=" size-3" />
      </div>
      <div className="w-[100px] flex flex-col justify-center items-center">
        <div className="z-10 shadow-[0_12px_23px_rgba(0,0,0,0.25)] h-[6px] bg-[#222222] text-[#F4F4F4] text-[10px] rounded-[6px] rounded-br-none flex justify-center items-center p-3 absolute right-[10px] top-[-28px] ">
          Evelina
        </div>
        <div className="z-0 w-[44px] h-[44px] rounded-full bg-slate-400 absolute right-[-20px] top-[-20px]">
          <Avatar className="h-full w-full">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>MP</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="p-[1rem] rounded-[5px]  ">
        <textarea
          ref={textAreaRef}
          className=" bg-inherit border-none w-full h-full resize-none text-base text-[#18181A]"
          defaultValue={body}
          onInput={() => {
            autoGrow(textAreaRef);
          }}
          onFocus={() => {
            setZIndex(cardRef.current);
          }}
        ></textarea>
      </div>
    </div>
  );
};

export default NoteCard;
