// import { useState } from "react";
// import { supabase } from "../lib/supabase";
// import { useNavigate } from "react-router-dom";

// export default function LoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();

//   // Google OAuth login
//   const handleGoogleLogin = async () => {
//     setLoading(true);
//     setError(null);
//     const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
//     if (error) setError(error.message);
//     setLoading(false);
//   };

//   // Email/password login
//   const handleEmailLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) setError(error.message);
//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-black">
//       <div className="bg-white/10 p-8 rounded-lg shadow-lg w-full max-w-sm">
//         <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign in to Interview Coder</h2>
//         <button
//           onClick={handleGoogleLogin}
//           className="w-full py-2 mb-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//           disabled={loading}
//         >
//           {loading ? "Signing in..." : "Sign in with Google"}
//         </button>
//         <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
//           <input
//             type="email"
//             placeholder="Email"
//             className="p-2 rounded"
//             value={email}
//             onChange={e => setEmail(e.target.value)}
//             required
//             disabled={loading}
//           />
//           <input
//             type="password"
//             placeholder="Password"
//             className="p-2 rounded"
//             value={password}
//             onChange={e => setPassword(e.target.value)}
//             required
//             disabled={loading}
//           />
//           <button
//             type="submit"
//             className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
//             disabled={loading}
//           >
//             {loading ? "Signing in..." : "Sign in with Email"}
//           </button>
//         </form>
//         {error && <div className="mt-4 text-red-400 text-sm text-center">{error}</div>}
//       </div>
//       <div className="mt-4 text-center">
//         <a href="#" onClick={() => navigate("/register")} className="text-blue-400 hover:underline text-sm">
//           Don't have an account? Register
//         </a>
//       </div>
//     </div>
//   );
// }


// import React from "react";

// export default function LoginPage() {
//   // This function will call the Electron main process to open the external login page
//   const handleExternalLogin = () => {
//     // Use the exposed electronAPI to open the external login page
//     window.electronAPI.openExternal("https://invisible-assistant.vercel.app/");
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-black">
//       <div className="bg-white/10 p-8 rounded-lg shadow-lg w-full max-w-sm">
//         <h2 className="text-2xl font-bold text-white mb-6 text-center">
//           Sign in to Interview Coder
//         </h2>
//         <button
//           onClick={handleExternalLogin}
//           className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//         >
//           Sign in
//         </button>
//       </div>
//     </div>
//   );
// }



import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../../assets/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleExternalLogin = () => {
    // window.electronAPI.openExternal("https://invisible-assistant.vercel.app/");
    window.electronAPI.openExternal("https://invizo.dev/?electron=1");
  };

  const handleCheckLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Redirect to the main page ("/" or whatever route shows SubscribedApp)
      navigate("/");
    } else {
      alert("You are still not logged in. Please complete login in the browser.");
    }
  };

  // return (
  //   <div className="min-h-screen flex flex-col items-center justify-center bg-white">
  //     {/* Logo */}
  //     <img
  //       src={logo} // <-- Replace with your actual logo path
  //       alt="Invizo Logo"
  //       className="w-24 h-24 mb-6"
  //       style={{ objectFit: "contain" }}
  //     />
  //     {/* Text */}
  //     <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
  //       Please sign in to continue
  //     </h2>
  //     {/* Sign in button */}
  //     <button
  //       onClick={handleExternalLogin}
  //       className="w-60 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
  //     >
  //       Sign in
  //     </button>
  //   </div>
  // );
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      {/* Logo in purple circle */}
      <div className="rounded-full bg-purple-500 w-30 h-30 flex items-center justify-center mb-8 shadow-lg">
        <img
          src={logo}
          alt="Invizo Logo"
          className="w-24 h-24 object-contain"
        />
      </div>
      {/* Heading */}
      <h1 className="text-3xl font-bold text-white mb-4 text-center">
        Log in to Invizo
      </h1>
      {/* Subtitle */}
      <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
        Please follow the next steps. If you are not redirected automatically,{" "}
        <span
          className="text-purple-300 cursor-pointer hover:underline"
          onClick={handleExternalLogin}
        >
          click here
        </span>
      </p>
      {/* Divider */}
      <div className="w-full max-w-md border-t border-white/10 my-8" />
      {/* Keyboard Shortcuts */}
      <div className="flex flex-col items-center w-full max-w-md">
        <div className="text-gray-300 text-base mb-4">Keyboard shortcuts</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <kbd className="bg-[#222] text-white px-2 py-1 rounded font-mono text-sm">⌘</kbd>
            <kbd className="bg-[#222] text-white px-2 py-1 rounded font-mono text-sm">B</kbd>
            <span className="text-gray-400 text-sm">to toggle visibility</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="bg-[#222] text-white px-2 py-1 rounded font-mono text-sm">⌘</kbd>
            <kbd className="bg-[#222] text-white px-2 py-1 rounded font-mono text-sm">Q</kbd>
            <span className="text-gray-400 text-sm">to quit</span>
          </div>
        </div>
      </div>
    </div>
  );
}