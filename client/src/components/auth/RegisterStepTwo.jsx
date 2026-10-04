import { useIntlayer } from "react-intlayer";
import { useEffect, useState } from "react";
import { Input, Button } from "@components/common";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

export default function RegisterStepTwo({
  username,
  errors,
  onChange,
  onNext,
  onBack,
  checking,
  available,
  suggestions,
  onSelectSuggestion,
}) {
  const t = useIntlayer('authRegister');
  const [showAvailability, setShowAvailability] = useState(false);

  useEffect(() => {
    if (username && username.length >= 3 && username.length <= 30) {
      setShowAvailability(true);
    } else {
      setShowAvailability(false);
    }
  }, [username, checking]);

  const handleInputChange = (e) => {
    onChange({ [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-heading-4 text-neutral-900">{t.step2Title}</h2>
      </div>

      <div>
        <Input
          type="text"
          label={t.usernameLabel.value}
          name="username"
          value={username}
          onChange={handleInputChange}
          placeholder={t.usernamePlaceholder.value}
          error={errors.username}
          required
        />
        
        {/* Availability Status */}
        {showAvailability && (
          <div className="mt-2">
            {checking ? (
              <p className="text-body-2 text-neutral-600 flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                {t.checkingAvailability}
              </p>
            ) : available === true ? (
              <p className="text-body-2 text-success flex items-center gap-2">
                <AiOutlineCheckCircle className="h-5 w-5" />
                {t.usernameAvailable}
              </p>
            ) : available === false ? (
              <p className="text-body-2 text-error flex items-center gap-2">
                <AiOutlineCloseCircle className="h-5 w-5" />
                {t.usernameTaken}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <p className="text-body-2 text-neutral-600">{t.usernameHint}</p>

      {/* Username Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-body-2 font-medium text-neutral-700 mb-2">
            {t.suggestionsTitle}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectSuggestion(suggestion)}
                className="px-3 py-1.5 text-sm border border-secondary-300 rounded-md 
                         hover:bg-secondary-50 hover:border-secondary-500 
                         transition-colors duration-200"
              >
                @{suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="w-full"
        >
          {t.backButton}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={checking || !available }
          loading={checking}
          className="w-full"
        >
          {t.nextButton}
        </Button>
      </div>
    </form>
  );
}
