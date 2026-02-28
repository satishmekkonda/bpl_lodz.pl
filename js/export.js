    async function exportImage(divId, filename) {
        const element = document.getElementById(divId);
        const canvas = await html2canvas(element);
        const data = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = data;
        link.download = `${filename}.png`;
        link.click();
    }

    function exportPDF(divId, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        doc.html(document.getElementById(divId), {
            callback: function (doc) { doc.save(`${filename}.pdf`); },
            x: 15, y: 15, width: 560, windowWidth: 1000
        });
    }

    function shareEmail(divId) {
        const email = prompt("Enter email address to send results to:");
        if (email) alert("Preparing attachment... (EmailJS template required to complete send)");
    }