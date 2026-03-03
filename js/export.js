async function exportImage(divId, filename) {
    const contentElement = document.getElementById(divId);
    const headerElement = document.querySelector('.header-row');

    const tempContainer = document.createElement('div');
    tempContainer.style.background = 'white'; 
    tempContainer.style.padding = '30px';
    tempContainer.style.width = '850px'; // Slightly wider for better table fit
    
    const clonedHeader = headerElement.cloneNode(true);
    const clonedContent = contentElement.cloneNode(true);

    // --- FIX FOR PLAYOFF ALIGNMENT ---
    // 1. Target the flex containers in the playoff cards
    const playoffRows = clonedContent.querySelectorAll('.playoff-match-card > div');
    playoffRows.forEach(row => {
        row.style.display = 'flex';
        row.style.flexDirection = 'row';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'center';
        row.style.gap = '10px';
        row.style.width = '100%';
    });

    // 2. Replace inputs with perfectly sized spans
    const inputs = clonedContent.querySelectorAll('input[type="number"]');
    inputs.forEach(inp => {
        const val = inp.value || "0";
        const span = document.createElement('span');
        span.innerText = val;
        // Visual styles to match the original box size but as static text
        span.style.fontWeight = 'bold';
        span.style.display = 'inline-block';
        span.style.width = '50px';
        span.style.height = '30px';
        span.style.lineHeight = '30px'; // Vertically centers text in the 30px height
        span.style.textAlign = 'center';
        span.style.border = '1px solid #cbd5e1';
        span.style.borderRadius = '4px';
        inp.parentNode.replaceChild(span, inp);
    });

    // 3. Ensure the hyphen and names stay on the same baseline
    const allSpans = clonedContent.querySelectorAll('.playoff-match-card span');
    allSpans.forEach(s => {
        s.style.display = 'inline-block';
        s.style.verticalAlign = 'middle';
        s.style.lineHeight = '30px'; 
    });

    tempContainer.appendChild(clonedHeader);
    tempContainer.appendChild(clonedContent);
    document.body.appendChild(tempContainer);

    const canvas = await html2canvas(tempContainer, {
        scale: 2, 
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
    });

    document.body.removeChild(tempContainer);

    const data = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = data;
    link.download = `${filename}.png`;
    link.click();
}

function exportPDF(divId, filename) {
    const { jsPDF } = window.jspdf;
    
    // We use the image export logic for the PDF to ensure alignment is identical
    const contentElement = document.getElementById(divId);
    const headerElement = document.querySelector('.header-row');
    const tempContainer = document.createElement('div');
    tempContainer.style.background = 'white';
    tempContainer.style.width = '850px';
    tempContainer.style.padding = '30px';

    const clonedHeader = headerElement.cloneNode(true);
    const clonedContent = contentElement.cloneNode(true);

    // Re-apply the same alignment fix as the image export
    const inputs = clonedContent.querySelectorAll('input[type="number"]');
    inputs.forEach(inp => {
        const span = document.createElement('span');
        span.innerText = inp.value || "0";
        span.style.cssText = "font-weight:bold; display:inline-block; width:50px; height:30px; line-height:30px; text-align:center; border:1px solid #cbd5e1; border-radius:4px; vertical-align:middle;";
        inp.parentNode.replaceChild(span, inp);
    });

    tempContainer.appendChild(clonedHeader);
    tempContainer.appendChild(clonedContent);

    html2canvas(tempContainer, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);
    });
}

function shareEmail(divId) {
    const email = prompt("Enter email address to send results to:");
    if (email) alert("Preparing attachment... (Requires EmailJS Setup)");
}