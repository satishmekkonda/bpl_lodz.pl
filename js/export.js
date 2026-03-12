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

// --- LIVE PAGE SPECIFIC EXPORTS ---
function exportLiveImage() {
    const content = document.getElementById('capture-overview');
    
    // 1. Create a hidden wrapper
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px'; 
    wrapper.style.top = '0';
    wrapper.style.width = '1100px'; 
    wrapper.style.background = '#f1f5f9';
    
    // 2. Clone the content
    const clone = content.cloneNode(true);
    
    // Manual sync for Champions and Overlay
    const realChamp = document.getElementById('champion-display');
    const cloneChamp = clone.querySelector('#champion-display');
    if (realChamp && cloneChamp) {
        cloneChamp.innerHTML = realChamp.innerHTML;
    }
    
    const realOverlay = document.getElementById('final-results-overlay');
    const cloneOverlay = clone.querySelector('#final-results-overlay');
    if (realOverlay && cloneOverlay) {
        cloneOverlay.style.visibility = realOverlay.style.visibility;
        cloneOverlay.style.height = realOverlay.style.height;
        cloneOverlay.style.margin = realOverlay.style.margin;
    }

    // Open all details in the clone
    const details = clone.querySelectorAll('details');
    details.forEach(d => d.setAttribute('open', ''));

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Give the browser a moment to render the off-screen clone
    setTimeout(function() {
        html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#f1f5f9',
            width: 1100
        }).then(function(canvas) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; 
            const imageData = canvas.toDataURL("image/png");

            // MOBILE FIX: Some mobile browsers block link.click() 
            // We use a more direct approach for the download
            const link = document.createElement('a');
            link.setAttribute('href', imageData);
            link.setAttribute('download', `BPL_Live_${dateStr}.png`);
            
            // Append to body briefly for mobile compatibility
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup the wrapper
            document.body.removeChild(wrapper);
        }).catch(function(error) {
            console.error("Capture failed:", error);
            if (document.body.contains(wrapper)) {
                document.body.removeChild(wrapper);
            }
        });
    }, 250); // Slightly longer delay for mobile rendering
}

async function exportLivePDF() {
    const { jsPDF } = window.jspdf;
    const content = document.getElementById('capture-overview');
    
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.background = '#f1f5f9';
    wrapper.style.width = '1100px';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    
    const clone = content.cloneNode(true);

    // --- ADDED: Force all tables to expand for the PDF ---
    const details = clone.querySelectorAll('details');
    details.forEach(d => d.setAttribute('open', ''));

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f1f5f9'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // DYNAMIC PDF SIZING:
    // This calculates the height based on your content so it doesn't get cut off
    const imgWidth = 210; // A4 Width in mm
    const pageHeight = 297; // A4 Standard height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 1. Create the timestamp for the filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-'); // HH-mm-ss
    const fullFilename = `BPL_Live_${dateStr}.pdf`;
    
    // If the content is taller than A4, we create a custom-sized PDF page to fit it all
    const pdf = new jsPDF('p', 'mm', [imgWidth, Math.max(pageHeight, imgHeight)]);
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(fullFilename);
    
    document.body.removeChild(wrapper);
}
