import { getMembers } from "@/actions/memberAction";
import { permanentMarker } from "@/app/fonts";
import { BriefcaseBusiness, LucideGithub, LucideLinkedin } from "lucide-react";

async function Page() {
  const members = await getMembers();
  // Getter union guard (Phase 3): fall back to an empty list if getMembers
  // returned its { error } shape — previously `members?.map` would throw on it.
  const memberList = !members || "error" in members ? [] : members;
  return (
    <div className="flex w-full animate-fadeIn flex-col items-center justify-start pt-[72px]">
      <div className="flex w-full flex-col items-center gap-10 px-4  py-10 sm:p-20">
        <h1
          className={`${permanentMarker.className} text-4xl dark:text-primary md:text-7xl`}
        >
          Meet Our Team
        </h1>
        <p
          className={`  md:text-md max-w-7xl px-2 text-justify text-sm md:px-10 md:text-center md:text-lg`}
        >
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
      <div className="flex w-full flex-col gap-6 pb-20 md:gap-12">
        {memberList.map((member, i) => {
          if (i % 2 === 0) {
            return (
              <div
                key={i}
                className="w-full md:grid md:grid-cols-5  md:gap-4 md:pr-2 lg:pr-28 "
              >
                <div className="pl-38 flex h-fit justify-end bg-gradient-to-r from-background to-[#3a557c] dark:to-primary/80 md:col-span-2 md:pl-72">
                  <img
                    src={`${member.memberImage}`}
                    alt="Profile Picture"
                    className="aspect-square max-w-[120px] md:max-w-[180px]"
                  />
                </div>
                <div className=" flex flex-col justify-between pl-4 md:col-span-3 md:pl-0">
                  <div className="flex h-fit gap-4">
                    <h2
                      className={`text-lg dark:text-primary md:text-3xl ${permanentMarker.className}`}
                    >
                      {member.memberName} {member.memberLastName}
                    </h2>
                    <div className="flex flex-col justify-end">
                      <p
                        className={` text-sm font-bold dark:text-primary/60 md:text-lg `}
                      >
                        {member.memberTitle}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="md:text-md text-sm leading-5">
                      {member.memberBio}
                    </p>
                  </div>
                  <div className="flex justify-end gap-4 p-4">
                    <a
                      target="_blank"
                      className=" transition-all duration-300 hover:text-primary"
                      href={`${member.memberPersonal}`}
                    >
                      <BriefcaseBusiness size={20} />
                    </a>
                    <a
                      target="_blank"
                      className=" transition-all duration-300 hover:text-primary"
                      href={`${member.memberGithub}`}
                    >
                      <LucideGithub size={20} />
                    </a>
                    <a
                      target="_blank"
                      className=" transition-all duration-300 hover:text-primary"
                      href={`${member.memberLinkedin}`}
                    >
                      <LucideLinkedin size={20} />
                    </a>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div
                key={i}
                className="grid w-full md:grid-cols-5  md:gap-4 md:pl-28 "
              >
                <div className="flex flex-col justify-between pr-4 md:col-span-3 md:pr-0">
                  <div className="flex h-fit justify-end gap-4">
                    <div className="flex flex-col justify-end">
                      <p
                        className={` text-sm font-bold dark:text-primary/60 md:text-lg `}
                      >
                        {member.memberTitle}
                      </p>
                    </div>
                    <h2
                      className={`text-lg dark:text-primary md:text-3xl  ${permanentMarker.className}`}
                    >
                      {member.memberName} {member.memberLastName}
                    </h2>
                  </div>
                  <div>
                    <p className="md:text-md text-end text-sm leading-5">
                      {member.memberBio}
                    </p>
                  </div>
                  <div className="flex justify-start gap-4 p-4">
                    <a
                      target="_blank"
                      className=" transition-all duration-300 hover:text-primary"
                      href={`${member.memberPersonal}`}
                    >
                      <BriefcaseBusiness size={20} />
                    </a>
                    <a
                      target="_blank"
                      className=" transition-all duration-300 hover:text-primary"
                      href={`${member.memberGithub}`}
                    >
                      <LucideGithub size={20} />
                    </a>
                    <a target="_blank" href={`${member.memberLinkedin}`}>
                      <LucideLinkedin size={20} />
                    </a>
                  </div>
                </div>
                <div className="pr-38 order-first flex h-fit justify-start bg-gradient-to-l from-background to-[#3a557c] dark:to-primary/80 md:order-last md:col-span-2 md:pr-72 ">
                  <img
                    src={`${member.memberImage}`}
                    alt="Profile Picture"
                    className="aspect-square max-w-[120px] md:max-w-[180px]"
                  />
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

export default Page;
