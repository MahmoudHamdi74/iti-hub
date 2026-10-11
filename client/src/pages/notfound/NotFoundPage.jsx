import { Link } from "react-router-dom";
import { FaHome, FaSearch, FaGlobe } from "react-icons/fa";
import { useIntlayer, useLocale } from "react-intlayer";


export default function NotFoundPage() {
  const { title, description, home, search, langSwitch } =
    useIntlayer('notFound');

  const { locale, setLocale } = useLocale();

  const toggleLanguage = () => {
    setLocale(locale === "ar" ? "en" : "ar");
  };

  return (
    <div
      className="
        min-h-[65vh] flex items-center justify-center px-4 relative
        from-primary-100 via-secondary-50 to-neutral-50
        animated-gradient
      "
    >
      {/* Language Switch */}
      <button
        onClick={toggleLanguage}
        className="
          absolute top-6 end-6 flex items-center gap-2
          px-4 py-2 rounded-lg
          border border-neutral-300
          text-neutral-700 
          hover:bg-neutral-100
          transition-all
        "
      >
        <FaGlobe />
        {langSwitch}
      </button>

      <div className="text-center max-w-md fade-in-up">
        {/* 404 */}
        <h1
          className="
            text-8xl font-extrabold 
            text-primary-600
            mb-4 floating
          "
        >
          404
        </h1>

        {/* Title */}
        <h2 className="text-heading-3 text-neutral-800 mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-body-2 text-neutral-500 mb-8">
          {description}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="
              glow-hover flex items-center justify-center gap-2
              px-6 py-3 rounded-xl
              bg-primary-600 text-white text-button
              shadow-elevation-2
              hover:bg-primary-700 hover:scale-105
              transition-all duration-300
            "
          >
            <FaHome />
            {home}
          </Link>

          <Link
            to="/search"
            className="
              glow-hover flex items-center justify-center gap-2
              px-6 py-3 rounded-xl
              border border-neutral-300
              text-neutral-700 text-button
              hover:bg-neutral-100 
              hover:scale-105
              transition-all duration-300
            "
          >
            <FaSearch />
            {search}
          </Link>
        </div>
      </div>
    </div>
  );
}
