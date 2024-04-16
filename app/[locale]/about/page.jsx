import { permanentMarker, pixelify } from "@/app/fonts";
import { BriefcaseBusiness, LucideGithub, LucideLinkedin } from "lucide-react";
import Image from "next/image";
import React from "react";

function Page() {
  return (
    <div className="flex flex-col justify-start items-center w-full pt-[72px] animate-fadeIn">
      <div className="w-full flex flex-col items-center p-20 gap-10">
        <h1 className={` ${permanentMarker.className} text-7xl`}>
          Meet Our Team
        </h1>
        <p className={`${pixelify.className} text-lg text-center px-10`}>
          We are a dynamic team of web developers united by our passion for
          crafting innovative digital experiences. With a diverse range of
          skills and backgrounds, we thrive on collaboration and creativity. Our
          team is equipped to tackle any project with enthusiasm and expertise.
          Together, we blend technical prowess with artistic flair to deliver
          tailored solutions that exceed expectations. Get to know the faces
          behind the code, and discover how our collective dedication drives
          success in every project we undertake!
        </p>
      </div>
      <div className="flex flex-col pb-20 gap-12">
        <div className="w-full flex pr-28 gap-4 ">
          <Image
            src="https://avatars.githubusercontent.com/u/103197785?v=4"
            width={180}
            height={180}
            priority={false}
            alt="User Picture"
            className="ml-32"
          />
          <div className="flex flex-col gap-6">
            <div className="flex h-fit gap-4">
              <h2
                className={`font-bold text-3xl  ${permanentMarker.className}`}
              >
                Kutalmış Berke Yılmaz
              </h2>
              <div className="flex flex-col justify-end">
                <p className={`font-bold text-lg ${pixelify.className}`}>
                  Developer
                </p>
              </div>
            </div>
            <div>
              <p className="">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Suscipit, dignissimos. Reprehenderit quas suscipit porro? Sit ex
                vitae pariatur temporibus rem, reiciendis accusantium dolorem
                molestiae expedita fuga.
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <a target="_blank" href="https://berkeyilmaz.vercel.app/">
                <BriefcaseBusiness />
              </a>
              <a target="_blank" href="https://github.com/sadikbarisyilmaz">
                <LucideGithub />
              </a>
              <a target="_blank" href="https://github.com/KBerkeYilmaz">
                <LucideLinkedin />
              </a>
            </div>
          </div>
        </div>
        <div className="w-full flex pl-28 gap-4 ">
          <div className="flex flex-col gap-6">
            <div className="flex h-fit gap-4 justify-end">
              <div className="flex flex-col justify-end">
                <p className={`font-bold text-lg ${pixelify.className}`}>
                  Developer
                </p>
              </div>
              <h2
                className={`font-bold text-3xl  ${permanentMarker.className}`}
              >
                Sadık Barış Yılmaz
              </h2>
            </div>
            <div>
              <p className="text-end">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Suscipit, dignissimos. Reprehenderit quas suscipit porro? Sit ex
                vitae pariatur temporibus rem, reiciendis accusantium dolorem
                molestiae expedita fuga.
              </p>
            </div>
            <div className="flex justify-start gap-4">
              <a target="_blank" href="https://sadikbarisyilmaz.dev">
                <BriefcaseBusiness />
              </a>
              <a target="_blank" href="https://github.com/sadikbarisyilmaz">
                <LucideGithub />
              </a>
              <a
                target="_blank"
                href="https://www.linkedin.com/in/sadikbarisyilmaz000/"
              >
                <LucideLinkedin />
              </a>
            </div>
          </div>
          <Image
            src="https://files.edgestore.dev/kqaxcqyn6e1epxep/publicFiles/_public/2ce38aa9-f6fb-4b0b-8b4e-52fee940f2b1.jpg"
            width={180}
            height={180}
            priority={false}
            alt="User Picture"
            className="mr-32"
          />
        </div>
      </div>
    </div>
  );
}

export default Page;
