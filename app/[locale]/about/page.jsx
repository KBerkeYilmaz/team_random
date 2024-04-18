import { getMembers } from "@/actions/memberAction";
import { permanentMarker } from "@/app/fonts";
import { BriefcaseBusiness, LucideGithub, LucideLinkedin } from "lucide-react";

async function Page() {
  const members = await getMembers();
  return (
    <div className="flex flex-col justify-start items-center w-full pt-[72px] animate-fadeIn">
      <div className="w-full flex flex-col items-center py-10 px-4  sm:p-20 gap-10">
        <h1
          className={`${permanentMarker.className} dark:text-primary text-4xl md:text-7xl`}
        >
          Meet Our Team
        </h1>
        <p
          className={`  max-w-7xl text-sm md:text-md md:text-lg text-justify md:text-center px-2 md:px-10`}
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
      <div className="flex flex-col w-full pb-20 gap-6 md:gap-12">
        {members?.map((member, i) => {
          if (i % 2 === 0) {
            return (
              <div
                key={i}
                className="w-full md:grid md:grid-cols-5  md:pr-2 lg:pr-28 md:gap-4 "
              >
                <div className="h-fit md:col-span-2 pl-38 md:pl-72 bg-gradient-to-r from-background dark:to-primary/80 to-[#3a557c] flex justify-end">
                  <img
                    src={`${member.memberImage}`}
                    alt="Profile Picture"
                    className="max-w-[120px] md:max-w-[180px] aspect-square"
                  />
                </div>
                <div className=" md:col-span-3 pl-4 md:pl-0 flex flex-col justify-between">
                  <div className="flex h-fit gap-4">
                    <h2
                      className={`text-lg md:text-3xl dark:text-primary ${permanentMarker.className}`}
                    >
                      {member.memberName} {member.memberLastName}
                    </h2>
                    <div className="flex flex-col justify-end">
                      <p
                        className={` dark:text-primary/60 font-bold text-sm md:text-lg `}
                      >
                        {member.memberTitle}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="leading-5 text-sm md:text-md">
                      {member.memberBio}
                    </p>
                  </div>
                  <div className="flex justify-end gap-4 p-4">
                    <a
                      target="_blank"
                      className=" hover:text-primary transition-all duration-300"
                      href={`${member.memberPersonal}`}
                    >
                      <BriefcaseBusiness size={20} />
                    </a>
                    <a
                      target="_blank"
                      className=" hover:text-primary transition-all duration-300"
                      href={`${member.memberGithub}`}
                    >
                      <LucideGithub size={20} />
                    </a>
                    <a
                      target="_blank"
                      className=" hover:text-primary transition-all duration-300"
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
                className="w-full grid md:grid-cols-5  md:pl-28 md:gap-4 "
              >
                <div className="md:col-span-3 pr-4 md:pr-0 flex flex-col justify-between">
                  <div className="flex h-fit gap-4 justify-end">
                    <div className="flex flex-col justify-end">
                      <p
                        className={` dark:text-primary/60 font-bold text-sm md:text-lg `}
                      >
                        {member.memberTitle}
                      </p>
                    </div>
                    <h2
                      className={`text-lg md:text-3xl dark:text-primary  ${permanentMarker.className}`}
                    >
                      {member.memberName} {member.memberLastName}
                    </h2>
                  </div>
                  <div>
                    <p className="text-end leading-5 text-sm md:text-md">
                      {member.memberBio}
                    </p>
                  </div>
                  <div className="flex justify-start gap-4 p-4">
                    <a
                      target="_blank"
                      className=" hover:text-primary transition-all duration-300"
                      href={`${member.memberPersonal}`}
                    >
                      <BriefcaseBusiness size={20} />
                    </a>
                    <a
                      target="_blank"
                      className=" hover:text-primary transition-all duration-300"
                      href={`${member.memberGithub}`}
                    >
                      <LucideGithub size={20} />
                    </a>
                    <a target="_blank" href={`${member.memberLinkedin}`}>
                      <LucideLinkedin size={20} />
                    </a>
                  </div>
                </div>
                <div className="h-fit order-first md:order-last md:col-span-2 pr-38 md:pr-72 bg-gradient-to-l from-background dark:to-primary/80 to-[#3a557c] flex justify-start ">
                  <img
                    src={`${member.memberImage}`}
                    alt="Profile Picture"
                    className="max-w-[120px] md:max-w-[180px] aspect-square"
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
