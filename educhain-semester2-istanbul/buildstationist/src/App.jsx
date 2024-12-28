import { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import CounterABI from "./CounterABI.json"; // ABI JSON dosyanızın yolunu buraya ekleyin
import "./App.css"; // CSS dosyanızı gerektiği gibi değiştirin

const App = () => {
  // Durum değişkenlerini tanımla
  const [contract, setContract] = useState(null); // Akıllı kontrat örneği
  const [accounts, setAccounts] = useState(null); // Kullanıcı hesapları
  const [currentCount, setCurrentCount] = useState(null); // Mevcut sayım değeri
  const [isConnecting, setIsConnecting] = useState(false); // Bağlantı durumu

  // Akıllı kontratın adresini .env dosyasından al
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

  // Cüzdan bağlantı fonksiyonu
  const connectWallet = async () => {
    if (window.ethereum) { // MetaMask yüklü mü kontrol et
      try {
        setIsConnecting(true); // Bağlantı işlemi başladığını belirt
        const web3Instance = new Web3(window.ethereum); // Web3 örneği oluştur
        await window.ethereum.request({ method: "eth_requestAccounts" }); // Kullanıcıdan hesap erişimi iste
        const accounts = await web3Instance.eth.getAccounts(); // Kullanıcı hesaplarını al
        setAccounts(accounts); // Hesapları duruma kaydet

        console.log('ABI:', CounterABI); // ABI'yı konsola yazdır (debug için)

        // Kontrat örneği oluştur
        const contractInstance = new web3Instance.eth.Contract(
          Array.isArray(CounterABI) ? CounterABI : CounterABI.abi || [], // ABI'nın doğru formatta olduğundan emin ol
          contractAddress // Kontrat adresi
        );
        setContract(contractInstance); // Kontratı duruma kaydet

        // Kontratla bağlantı kurulduktan sonra sayımı al
        const count = await contractInstance.methods.retrieve().call();
        setCurrentCount(Number(count)); // Sayım değerini güncelle
      } catch (error) {
        if (error.code === -32002) { // Hata kodu -32002: Zaten bir bağlantı isteği var
          alert(
            "MetaMask ile bağlantı için zaten bekleyen bir istek var. Lütfen kontrol edin."
          );
        } else {
          console.error("MetaMask'a bağlanırken hata oluştu", error);
        }
      } finally {
        setIsConnecting(false); // Bağlantı işlemi tamamlandı
      }
    } else {
      alert("MetaMask yüklü değil"); // MetaMask yüklü değilse kullanıcıyı bilgilendir
    }
  };

  // Cüzdan bağlantısını kesme fonksiyonu
  const disconnectWallet = () => {
    setContract(null); // Kontratı sıfırla
    setAccounts(null); // Hesapları sıfırla
    setCurrentCount(null); // Sayım değerini sıfırla
  };

  // Sayacı artırma fonksiyonu
  const incrementCounter = async () => {
    if (contract && accounts) { // Kontrat ve hesaplar mevcutsa
      try {
        const res = await contract.methods
          .increment() // 'increment' metodunu çağır
          .send({ from: accounts[0] }); // İşlemi kullanıcının hesabından gönder
        console.log(res); // İşlem sonucunu konsola yazdır
        fetchCurrentCount(); // Güncellenmiş sayımı al
      } catch (error) {
        console.error("Sayacı artırırken hata oluştu", error);
      }
    }
  };

  // Mevcut sayımı alma fonksiyonu
  const fetchCurrentCount = useCallback(async () => {
    if (contract) { // Kontrat mevcutsa
      try {
        const count = await contract.methods.retrieve().call(); // 'retrieve' metodunu çağır
        console.log(count); // Sayım değerini konsola yazdır
        setCurrentCount(Number(count)); // Sayım değerini güncelle
      } catch (error) {
        console.error("Mevcut sayımı alırken hata oluştu", error);
      }
    }
  }, [contract]); // 'contract' değiştiğinde fonksiyon yeniden oluşturulur

  // Kontrat veya fetchCurrentCount değiştiğinde sayımı al
  useEffect(() => {
    if (contract) {
      fetchCurrentCount();
    }
  }, [contract, fetchCurrentCount]);

  return (
    <div className="App">
      <h1>Counter DApp</h1>
      {accounts ? ( // Eğer kullanıcı bağlıysa
        <>
          <p>Bağlı Hesap: {accounts[0]}</p> {/* İlk hesabı göster */}
          <p>
            Mevcut Sayım:{" "}
            {currentCount !== null ? (
              currentCount // Sayım değeri mevcutsa göster
            ) : (
              <span className="loading">Yükleniyor...</span> // Yükleniyorsa "Yükleniyor" göster
            )}
          </p>
          <button onClick={incrementCounter}>Sayacı Artır</button> {/* Sayacı artırma butonu */}
          <button onClick={disconnectWallet}>Cüzdanı Bağlantıyı Kes</button> {/* Cüzdan bağlantısını kesme butonu */}
        </>
      ) : (
        <button onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? "Bağlanıyor..." : "Cüzdanı Bağla"} {/* Bağlantı durumu */}
        </button>
      )}
    </div>
  );
};

export default App;
