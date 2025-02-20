import { useState, useEffect, useRef } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane , faSpinner} from "@fortawesome/free-solid-svg-icons";

function App() {

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [sourceLang, setSourceLang] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setTargetLang(selectedLang);
  }, [selectedLang]);

  //scroll to the bottom of the message container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"})
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);


  const handleSend = async () => {
    
    if (!inputText.trim()) {
      setError("Please enter some text")
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const newMessage = {
        id:Date.now(),
        text: inputText,
        type: 'user',
      };

      //Determine the language of input text, so it can be translated.
      const detector = await window.ai.languageDetector.create()
      const detectedLang = await detector.detect(inputText)

      newMessage.detectedLanguage = detectedLang[0].detectedLanguage
      setSourceLang(newMessage.detectedLanguage)
    
      setMessages(prev => [...prev,newMessage]);
      setInputText('');

    } catch (error) {
      console.error('Error detecting language:', error);
      setError("Your   browser doesn't support the Translator or Language Detector APIs. If you're in Chrome, join the Early Preview Program to enable it.")
      // setError("There was a problem detecting the language. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  //Summarize text
  const handleSummarize = async(messageId,text) => {
    setIsLoading(true)

    try {
      const summarizer = await window.ai.summarizer.create()
      const summary = await summarizer.summarize(text)
      setMessages((prev) => 
      prev.map((msg) => msg.id === messageId? [...msg, summary]: msg))
    } catch (error) {
      console.error('Error summarizing text:',error)
    } finally {
      setIsLoading(false)
    }
  }

   //Translate text
  const handleTranslate = async( messageId,text) => {
    setIsLoading(true)

    if(sourceLang === targetLang) {
      console.warn('"Source and Target language are the same. Choose a different target.')
    }

    try {
      const translator = await window.ai.translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      })

      const translation = await translator.translate(text)
      setTargetLang(selectedLang)
      
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === messageId? {...msg, translation}: msg)
      )

    } catch (error) {
      // setError("Your   browser doesn't support the Translator or Language Detector APIs. If you're in Chrome, join the Early Preview Program to enable it.")
      console.error('Error Translating text:',error)
    }finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          {/* App Title */}
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Text Processor
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-indigo-100">
            Summarize, Translate, and Detect Language with Ease
          </p>
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user'? 'justify-end':'justify-start'}`}
          >
            <div className={`p-4 rounded-lg max-w-[80%] ${message.type ==='user'?'bg-blue-600 text-white':'bg-white shadow-md'}`}>
              <p className="break-words">{message.text}</p>

              {message.detectedLanguage && (
                  <div className="mt-2 text-xs text-gray-300">
                    Detected language: {message.detectedLanguage}
                  </div>
              )}

              {message.type === 'user' && 
              <div className="mt-4 space-y-2">
                {message.text.length >150 && message.detectedLanguage === 'en' && (
                  <button
                  aria-label="summarize"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                  onClick={()=> handleSummarize(message.id, message.text)}
                  disabled={isLoading}
                  >
                    {isLoading? "Summarizing...":"Summarize"}
                  </button>
                )}

              <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    value={selectedLang}
                     onChange={e=>setSelectedLang(e.target.value)}
                    className="p-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  >
                    {['en', 'pt', 'es', 'ru', 'tr', 'fr'].map((lang)=> (
                      <option key={lang} value={lang} className="p-2 text-gray-700 hover:bg-indigo-100">
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={()=> handleTranslate(message.id, message.text)}
                    className="bg-green-600 px-4 py-2 rounded-lg text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer" 
                    aria-label="Translate"
                    disabled={isLoading}
                  >
                      {isLoading? <div className="space-x-2">
                        <FontAwesomeIcon icon={faSpinner} className="text-white"/>
                        Translating
                        </div> :'Translate'}
                  </button>
            </div>
              </div>
              }

              {message.summary && 
              <div className="mt-4 p-3 rounded-lg bg-blue-100">
                <h4 className="mb-2 font-semibold text-gray-700">Summary</h4>
                <p className="text-gray-700">{message.summary}</p>
              </div>}

              {message.translation && (
                <div className="mt-4 p-3 rounded-lg bg-green-100">
                  <h4 className="font-semibold mb-2 text-gray-700">Translated to: {selectedLang.toUpperCase()}</h4>
                  <p className="text-gray-700">{message.translation}</p>
                </div>
              )}
            </div>
          </div>
        )
        )}
        <div ref={messagesEndRef}/>
      </div>

        {/* input container */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className=" flex justify-between gap-2 ">
            <textarea 
              value={inputText}
              onChange={(e)=> (setInputText(e.target.value))}
              placeholder="Enter your text..."
              aria-label="text input"
              disabled={isLoading}
              className="flex-grow p-3 rounded-lg border border-gray-300 resize-none focus:outline-0 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              aria-label="send message"
              className=" flex items-center justify-center cursor-pointer bg-indigo-600 text-white rounded-lg p-3  hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>

          {error && <div className="p-2 bg-red-100 text-red-700 text-center" role="alert">{error}</div>}
        </div>
    </div>
  )
}

export default App
