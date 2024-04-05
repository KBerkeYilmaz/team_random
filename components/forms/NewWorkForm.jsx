"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEdgeStore } from "@/lib/edgestore";
import { Separator } from "@/components/ui/separator";
import { createMember } from "@/actions/memberAction";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MultiImageDropzone } from "@/components/MultiImageDropzone";

const NewWorkForm = () => {
  const { edgestore } = useEdgeStore();
  const [pending, setPending] = useState(false);
  const [fileStates, setFileStates] = useState([]);
  const { toast } = useToast();
  const nameInputRef = useRef(null);
  const lastNameInputRef = useRef(null);
  const bioInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const personalInputRef = useRef(null);
  const githubInputRef = useRef(null);
  const linkedinInputRef = useRef(null);

  //   function updateFileProgress(key, progress) {
  //     setFileStates((fileStates) => {
  //       const newFileStates = structuredClone(fileStates);
  //       const fileState = newFileStates.find(
  //         (fileState) => fileState.key === key
  //       );
  //       if (fileState) {
  //         fileState.progress = progress;
  //       }
  //       return newFileStates;
  //     });
  //   }

  async function newMember(e) {
    e.preventDefault();
    setPending(true);
    const name = nameInputRef.current.value;
    const lastName = lastNameInputRef.current.value;
    const bio = bioInputRef.current.value;
    const title = titleInputRef.current.value;
    const personal = personalInputRef.current.value;
    const github = githubInputRef.current.value;
    const linkedin = linkedinInputRef.current.value;
    try {
      if (!file) {
        throw new Error("Please select a picture to be uploaded.");
      }
      const res = await edgestore.publicFiles.upload({
        file,
      });
      // you can run some server action or api here
      // to add the necessary data to your database
      const img = res.url;
      const formData = {
        memberName: name,
        memberLastName: lastName,
        memberBio: bio,
        memberTitle: title,
        memberPersonal: personal,
        memberGithub: github,
        memberLinkedin: linkedin,
        memberImage: img,
      };
      const response = await createMember(formData); // Assuming createMember can handle the object directly
      if (response.error) {
        throw new Error(response.error);
      }
      nameInputRef.current.value = "";
      lastNameInputRef.current.value = "";
      bioInputRef.current.value = "";
      titleInputRef.current.value = "";
      personalInputRef.current.value = "";
      githubInputRef.current.value = "";
      linkedinInputRef.current.value = "";
      setFile(null);
      toast({
        description: "Member Created !",
      });
    } catch (error) {
      toast({
        description: `Error creating member: ${error.message || error}`,
      });
      // Handle error, e.g., show error message
    } finally {
      setPending(false); // Reset pending status
    }
  }

  return (
    <div className="flex gap-4 flex-col-reverse sm:flex-row">
      <form
        onSubmit={newMember}
        className="space-y-8"
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col w-full md:w-fit gap-2">
            <Label htmlFor="memberName">First Name</Label>
            <Input
              placeholder="First Name"
              name="memberName"
              type="text"
              className="block"
              ref={nameInputRef}
              required
            />
          </div>
          <div className="flex flex-col w-full md:w-fit gap-2">
            <Label htmlFor="memberLastName">Last Name</Label>
            <Input
              placeholder="Last Name"
              name="memberLastName"
              type="text"
              ref={lastNameInputRef}
              required
            />
          </div>
          <div className="flex flex-col w-full md:w-fit gap-2">
            <Label htmlFor="memberTitle">Title</Label>
            <Input
              placeholder="Title"
              name="memberTitle"
              type="text"
              ref={titleInputRef}
              required
            />
          </div>
        </div>
        <div className="flex flex-col flex-wrap gap-2 ">
          <Label htmlFor="memberBio">Bio (Optional)</Label>
          <Textarea
            name="memberBio"
            type="text"
            className="p-2"
            ref={bioInputRef}
          />
        </div>
        <Separator />

        <div className="flex flex-col">
          <h2 className="text-2xl mb-4">Links (Optional)</h2>
          <div className="flex gap-2 flex-wrap flex-col">
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="memberPersonal">Personal App</Label>
              <Input
                placeholder="Personal Link"
                name="memberPersonal"
                type="text"
                ref={personalInputRef}
              />
            </div>
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="memberGithub">Github</Label>
              <Input
                placeholder="Github Link"
                name="memberGithub"
                type="text"
                ref={githubInputRef}
              />
            </div>
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="memberLinkedin">LinkedIn</Label>
              <Input
                placeholder="Linkedin Link"
                name="memberLinkedin"
                type="text"
                ref={linkedinInputRef}
              />
            </div>
          </div>
        </div>
        <Button
          type="submit"
          disabled={pending}
          className={`w-full`}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Add Member"
          )}
        </Button>
      </form>
      {/* <p
        aria-live="polite"
        className="sr-only"
      >
        {state?.message}
      </p> */}

      <div>
        <MultiImageDropzone
          value={fileStates}
          dropzoneOptions={{
            maxFiles: 6,
          }}
          onChange={(files) => {
            setFileStates(files);
          }}
          onFilesAdded={async (addedFiles) => {
            setFileStates([...fileStates, ...addedFiles]);
            await Promise.all(
              addedFiles.map(async (addedFileState) => {
                try {
                  const res = await edgestore.publicFiles.upload({
                    file: addedFileState.file,
                    // onProgressChange: async (progress) => {
                    //   updateFileProgress(addedFileState.key, progress);
                    //   if (progress === 100) {
                    //     // wait 1 second to set it to complete
                    //     // so that the user can see the progress bar at 100%
                    //     await new Promise((resolve) =>
                    //       setTimeout(resolve, 1000)
                    //     );
                    //     updateFileProgress(addedFileState.key, "COMPLETE");
                    //   }
                    // },
                  });
                  console.log(res);
                } catch (err) {
                //   updateFileProgress(addedFileState.key, "ERROR");
                console.log(err)
                }
              })
            );
          }}
        />
      </div>
    </div>
  );
};

export default NewWorkForm;
